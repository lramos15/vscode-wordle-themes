import * as vscode from 'vscode';

export interface WordleTheme {
  correctSpotEmoji: string;
  correctLetterEmoji: string;
  wrongLetterEmoji: string;
}

interface WorldeThemeConfigurationEntry extends WordleTheme {
  name: string;
};

const wordleDarkTheme: WordleTheme = {
  correctSpotEmoji: '🟩',
  correctLetterEmoji: '🟨',
  wrongLetterEmoji: '⬛'
};

const wordleLightTheme: WordleTheme = {
  correctSpotEmoji: '🟩',
  correctLetterEmoji: '🟨',
  wrongLetterEmoji: '⬜'
};

const colorBlindWordleTheme: WordleTheme = {
  correctSpotEmoji: '🟧',
  correctLetterEmoji: '🟦',
  wrongLetterEmoji: '⬜'
};

const heartTheme: WordleTheme = {
  correctSpotEmoji: '💚',
  correctLetterEmoji: '💛',
  wrongLetterEmoji: '💔'
};

const appleTheme: WordleTheme = {
  correctSpotEmoji: '',
  correctLetterEmoji: '',
  wrongLetterEmoji: '',
};


export class ThemeParser{
  // The theme previously chosen by the user.
  private _previousTheme: string | undefined;

  private _themes: Map<string, WordleTheme> = new Map<string, WordleTheme>();

  constructor() {
    this._previousTheme = undefined;
    this.loadThemes();
  }

  private isWordleText(text: string) {
    // Ensure text contains Wordle Some Number Some number / Some Number  
    const wordleRegex = /Wordle \d+ \d\/\d/g;
    const foundMatch = wordleRegex.test(text);
    return foundMatch;
  }

  /**
   * Gets the list of wordle themes
   * @returns An array of strings representing the loaded wordle themes
   */
  public getThemeNames(): string[] {
    return Array.from(this._themes.keys());
  }

  public async changeTheme(themeName: string) {
    // Currently active editor
    const activeTextEditor = vscode.window.activeTextEditor;

    // If there isn't one we can't change themes
    if (!activeTextEditor) {
      vscode.window.showErrorMessage('Must open file and paste in wordle results.');
      return;
    }
    let text = activeTextEditor.document.getText();
    // If it doesn't contain the wordle header probably not a wordle file so we be safe and don't attempt to change theme
    if (!this.isWordleText(text)) {
      vscode.window.showErrorMessage('File missing wordle results heading, not applied for safety reasons.');
      return;
    }
    if (!this._previousTheme) {
      this._previousTheme = this.detectTheme(text);
    }

    // If the theme doesn't exist we error out
    if (!this._themes.has(themeName) || !this._themes.has(this._previousTheme)) {
      vscode.window.showErrorMessage(`Theme ${themeName} or ${this._previousTheme} does not exist.`);
      return;
    }
    
    // Replace the theme with the new one (null assert ok here because we check above)
    const theme = this._themes.get(themeName)!;
    const previousTheme = this._themes.get(this._previousTheme)!;
    // Apply the theme via regexes that replace the old theme characters with the new ones
    text = text.replace(new RegExp(previousTheme.correctSpotEmoji, 'g'), theme.correctSpotEmoji);
    text = text.replace(new RegExp(previousTheme.correctLetterEmoji, 'g'), theme.correctLetterEmoji);
    text = text.replace(new RegExp(previousTheme.wrongLetterEmoji, 'g'), theme.wrongLetterEmoji);


    // Update previous theme
    this._previousTheme = themeName;

    // Full find and replace means use a whole document range
    const entireDocumentRange = activeTextEditor.document.validateRange(new vscode.Range(0, 0, activeTextEditor.document.lineCount, 0));
    return activeTextEditor.edit(editBuilder => {
      // Get the position of all 'a' characters in the document
      editBuilder.replace(entireDocumentRange, text);
    });
  }

  /**
   * Returns the pasted theme, only detects the themes that ship with wordle
   * Makes a best guess if not enough info is pasted to determine the theme
   */
  private detectTheme(text: string): string {
    if (this._previousTheme) {
      return this._previousTheme;
    }
    // Find number of matches to 🟩 or 🟨 or ⬛
    const wordleDarkMatches = text.match(/🟩|🟨|⬛/g) ?? [];
    // Find number of matches to 🟧 or 🟦 or ⬜
    const colorBlindMatches = text.match(/🟧|🟦|⬜/g) ?? [];
    // Find number of matches to 🟩 or 🟨 or ⬜
    const wordleLightMatches = text.match(/🟩|🟨|⬜/g) ?? [];

    if (wordleDarkMatches.length > wordleLightMatches.length && wordleDarkMatches.length > colorBlindMatches.length) {
      return 'Dark';
    } else if (wordleLightMatches.length > wordleDarkMatches.length && wordleLightMatches.length > colorBlindMatches.length) {
      return 'Light';
    } else {
      return 'Color Blind';
    }
  }

  /**
   * Load the themes from the user configuration
   */
  public loadThemes() {
    this._themes.clear();
    // Add the default themes that ship with wordle to the selector
    this._themes.set('Dark', wordleDarkTheme);
    this._themes.set('Light', wordleLightTheme);
    this._themes.set('Color Blind', colorBlindWordleTheme);
    this._themes.set('Heart', heartTheme);

    const themesConfiguration = vscode.workspace.getConfiguration('wordlethemes').get("themes") as WorldeThemeConfigurationEntry[];
    for (const theme of themesConfiguration) {
      this._themes.set(theme.name, theme);
    }
  }

  /**
   * Resets what the previous theme is. This is useful for when the extension can no longer guess the theme
   */
  public resetThemeMemory() {
    this._previousTheme = undefined;
  }
}
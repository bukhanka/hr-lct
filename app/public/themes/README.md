# Theme Assets

This directory contains theme-specific assets (backgrounds, icons, audio) for campaign themes.

## Structure

Each theme has its own directory with the following structure:

```
/themes/
  ├── galactic-academy/
  │   ├── background.png    # Theme background image
  │   ├── icon.svg          # Theme icon
  │   └── ambient.mp3       # Optional background audio
  ├── corporate-metropolis/
  │   ├── background.png
  │   ├── icon.svg
  │   └── ambient.mp3
  └── esg-mission/
      ├── background.png
      ├── icon.svg
      └── ambient.mp3
```

## Usage

Assets are referenced in `theme-presets.ts` and loaded dynamically based on the selected theme.

Example:
```typescript
{
  themeId: "galactic-academy",
  assets: {
    background: "/themes/galactic-academy/background.png",
    icon: "/themes/galactic-academy/icon.svg",
    audio: "/themes/galactic-academy/ambient.mp3"
  }
}
```

## Adding New Themes

1. Create a new directory under `/public/themes/[theme-id]/`
2. Add assets (at minimum: background.png and icon.svg)
3. Reference in theme-presets.ts
4. Update theme config to include asset paths

# YTM No Slop

<img src=".github/icon.svg" align="right" width="128" height="128" />

An open-source browser extension (Chrome, Firefox) for YouTube Music that blocks AI slop artists and songs.

This extension works locally, with the exception of regularly downloading a crowd-sourced database of AI slop artists, per [Acknowledgements](#acknowledgements).

## What does this extension do?

The extension observes when a track starts playing on YouTube Music and checks if the artist or song title matches any entries in the local database of AI slop artists. If a match is found, the track is both disliked and skipped. Disliking is important to “train” the YouTube Music algorithm to play less of this type of music, such that it should hopefully stop adding it to your automatic playlists.

In addition to the automatic, crowd-sourced database (“AI DB”), you can also add your own custom entries to the database via the extension's popup:

- Keywords: matches song titles & artist names
- Songs: matches song titles alone
- Artists: matches artist names alone

All skipped tracks are visible in the “History” tab.

You can pause the auto-skipping by toggling the switch in the top-right corner of the popup.

|                                        |                                      |
| -------------------------------------- | ------------------------------------ |
| ![Light theme](.github/light-demo.gif) | ![Dark theme](.github/dark-demo.gif) |

## Build Setup

This project uses **Nix** for the development environment and **WXT** for the extension framework.

```shell
$ nix develop
% yarn install
% yarn dev:chrome
% yarn dev:firefox
```

## Acknowledgements

The database of AI slop artists is a crowd-sourced effort by the community, called [_Soul Over AI_](https://souloverai.com), licensed under the [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). This extension uses this database, in addition to manually added entries.

## License

This project is licensed under the [MIT License](LICENSE).

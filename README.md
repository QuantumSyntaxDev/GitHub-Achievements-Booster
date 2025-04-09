# GitHub Achievements Booster

A Node.js script to automate earning GitHub achievements and a cleanup tool to remove temporary repositories.

## Features

- **Achievements Automation** (`github-achievements.js`):
  - **Starstruck (GOLD)**: Creates a repo to aim for 4096+ stars.
  - **Quickdraw (DEFAULT)**: Closes an issue within 5 minutes.
  - **Pull Shark (SILVER)**: Merges 128 PRs (scalable to 1024 for GOLD).
  - **Galaxy Brain (GOLD)**: Generates 32 answers for manual posting.
  - **YOLO (DEFAULT)**: Merges a PR without review.
- **Cleanup Tool** (`cleanup-repos.js`): Deletes temporary repos created during achievement runs.

## Prerequisites

- [Node.js](https://nodejs.org/) installed.
- A GitHub Personal Access Token with `repo` scope.
- Google Generative AI API Key (for content generation).

## Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/QuantumSyntaxDev/GitHub-Achievements-Booster.git
   cd GitHub-Achievements-Booster
   ```

2. Install dependencies:
   ```bash
   npm install @octokit/rest @google/generative-ai dotenv
   ```

3. Create a `.env` file in the root directory:
   ```
   GITHUB_TOKEN=your_github_token
   GITHUB_USERNAME=your_username
   GOOGLE_API_KEY=your_google_api_key
   ```

## Usage

### Run Achievements Script
```bash
node github-achievements.js
```
- Follow console instructions for manual steps (e.g., promoting `Starstruck` repo or posting `Galaxy Brain` answers).

### Cleanup Temporary Repos
```bash
node cleanup-repos.js
```
- Deletes repos matching patterns like `starstruck-repo-*`, `quickdraw-repo-*`, etc.

## Notes

- **Rate Limits**: GitHub API has rate limits; avoid running excessively in a short time.
- **Manual Steps**: Some achievements (e.g., `Starstruck`, `Galaxy Brain`) require manual effort post-script.
- **Scalability**: Adjust `targetPRs` in `achievePullShark` for GOLD (1024 PRs).

## License

MIT License - feel free to modify and share!

---

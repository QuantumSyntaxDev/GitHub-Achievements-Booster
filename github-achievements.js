require('dotenv').config();
const { Octokit } = require('@octokit/rest');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * +---------------------+
 * | Environment Setup   |
 * +---------------------+
 * Loads sensitive credentials from the .env file for secure API access.
 */
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;       // GitHub Personal Access Token
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;   // Google Generative AI API Key
const USERNAME = process.env.GITHUB_USERNAME;        // Your GitHub username

/**
 * +---------------------+
 * | GitHub API Client   |
 * +---------------------+
 * Initializes Octokit for interacting with GitHub's REST API.
 */
const octokit = new Octokit({ auth: GITHUB_TOKEN });

/**
 * +---------------------+
 * | Google GenAI Setup  |
 * +---------------------+
 * Sets up the Google Generative AI client for content generation.
 */
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * +---------------------+
 * | Achievement Status  |
 * +---------------------+
 * Tracks completed GitHub achievements. Manually updated based on profile.
 * @type {Object.<string, boolean>}
 */
const achievementsStatus = {
  Starstruck: false, // GOLD: 4096 stars
  Quickdraw: false,  // DEFAULT: 1
  PullShark: false,  // GOLD: 1024 PRs
  GalaxyBrain: false,// GOLD: 32 answers
  YOLO: false,       // DEFAULT: 1
};

/**
 * +---------------------+
 * | Generate Content    |
 * +---------------------+
 * Generates and sanitizes content using Google Generative AI.
 * @async
 * @param {string} prompt - The prompt to generate content from.
 * @returns {Promise<string>} - Sanitized content, max 350 characters.
 */
async function generateContent(prompt) {
  const response = await model.generateContent({
    contents: [{ parts: [{ text: prompt }] }],
  });
  let text = response.response.text();
  text = text.replace(/[\n\r\t\0-\x1F\x7F-\x9F]/g, ' ').trim();
  return text.substring(0, 350);
}

/**
 * +---------------------+
 * | Starstruck (GOLD)   |
 * +---------------------+
 * Creates a repository to attract 4096+ stars for the Starstruck achievement.
 * @async
 * @returns {Promise<void>}
 */
async function achieveStarstruck() {
  if (achievementsStatus.Starstruck) {
    console.log('Starstruck: Already earned, skipping.');
    return;
  }
  const repoName = `starstruck-repo-${Date.now()}`;
  console.log(`Creating repository: ${repoName}`);
  
  await octokit.repos.createForAuthenticatedUser({
    name: repoName,
    description: await generateContent('Write an awesome open-source project description to attract 4096+ stars.'),
    auto_init: true,
  });
  
  console.log('Starstruck: Repository created. Promote this repo to get 4096+ stars for GOLD!');
  console.log(`Repo URL: https://github.com/${USERNAME}/${repoName}`);
  achievementsStatus.Starstruck = false; // Manual promotion required
}

/**
 * +---------------------+
 * | Quickdraw (DEFAULT) |
 * +---------------------+
 * Creates and closes an issue within 5 minutes for Quickdraw.
 * @async
 * @returns {Promise<void>}
 */
async function achieveQuickdraw() {
  if (achievementsStatus.Quickdraw) {
    console.log('Quickdraw: Already earned, skipping.');
    return;
  }
  const repoName = `quickdraw-repo-${Date.now()}`;
  await octokit.repos.createForAuthenticatedUser({ name: repoName, auto_init: true });

  const issue = await octokit.issues.create({
    owner: USERNAME,
    repo: repoName,
    title: await generateContent('Generate a simple issue title.'),
    body: await generateContent('Write a brief issue description.'),
  });

  await octokit.issues.update({
    owner: USERNAME,
    repo: repoName,
    issue_number: issue.data.number,
    state: 'closed',
  });

  console.log('Quickdraw: Issue created and closed within 5 minutes (DEFAULT earned).');
  achievementsStatus.Quickdraw = true;
}

/**
 * +---------------------+
 * | Pull Shark (SILVER) |
 * +---------------------+
 * Automates creation and merging of 128 PRs (SILVER) for Pull Shark.
 * @async
 * @returns {Promise<void>}
 */
async function achievePullShark() {
    if (achievementsStatus.PullShark) {
      console.log('Pull Shark: Already earned, skipping.');
      return;
    }
    const repoName = `pullshark-repo-${Date.now()}`;
    console.log(`Creating repository: ${repoName}`);
    await octokit.repos.createForAuthenticatedUser({ name: repoName, auto_init: true });
  
    let { data: branchData } = await octokit.repos.getBranch({
      owner: USERNAME,
      repo: repoName,
      branch: 'main',
    });
    let mainCommitSha = branchData.commit.sha;
    let { data: fileData } = await octokit.repos.getContent({  // Fixed line here
      owner: USERNAME,
      repo: repoName,
      path: 'README.md',
      ref: 'main',
    });
    let readmeSha = fileData.sha;
  
    const targetPRs = 128; // SILVER level; adjust to 1024 for GOLD
    console.log(`Creating ${targetPRs} pull requests for Pull Shark (SILVER: 128, GOLD: 1024)...`);
  
    for (let i = 1; i <= targetPRs; i++) {
      const branchName = `feature-branch-${i}`;
      await octokit.git.createRef({
        owner: USERNAME,
        repo: repoName,
        ref: `refs/heads/${branchName}`,
        sha: mainCommitSha,
      });
  
      await octokit.repos.createOrUpdateFileContents({
        owner: USERNAME,
        repo: repoName,
        path: 'README.md',
        message: `Update README ${i}`,
        content: Buffer.from(await generateContent(`Write README content for PR ${i}.`)).toString('base64'),
        sha: readmeSha,
        branch: branchName,
      });
  
      const pr = await octokit.pulls.create({
        owner: USERNAME,
        repo: repoName,
        title: await generateContent(`Generate PR title ${i}.`),
        body: await generateContent(`Write PR description ${i}.`),
        head: branchName,
        base: 'main',
      });
  
      await octokit.pulls.merge({
        owner: USERNAME,
        repo: repoName,
        pull_number: pr.data.number,
      });
  
      // Update SHAs for next iteration
      ({ data: branchData } = await octokit.repos.getBranch({
        owner: USERNAME,
        repo: repoName,
        branch: 'main',
      }));
      mainCommitSha = branchData.commit.sha;
      ({ data: fileData } = await octokit.repos.getContent({
        owner: USERNAME,
        repo: repoName,
        path: 'README.md',
        ref: 'main',
      }));
      readmeSha = fileData.sha;
  
      console.log(`Pull Shark: Merged PR ${i}/${targetPRs}`);
    }
  
    console.log(`Pull Shark: ${targetPRs} pull requests merged (SILVER earned, aim for 1024 for GOLD).`);
    achievementsStatus.PullShark = true; // Adjust based on actual goal
  }

/**
 * +---------------------+
 * | Galaxy Brain (GOLD) |
 * +---------------------+
 * Generates 32 answers for manual posting to earn Galaxy Brain.
 * @async
 * @returns {Promise<void>}
 */
async function achieveGalaxyBrain() {
  if (achievementsStatus.GalaxyBrain) {
    console.log('Galaxy Brain: Already earned, skipping.');
    return;
  }
  console.log('Galaxy Brain: Generating 32 answers for manual posting (GOLD: 32)...');
  const answers = [];
  for (let i = 1; i <= 32; i++) {
    const answer = await generateContent(`Write a helpful answer to a coding question ${i} about JavaScript (e.g., closures, promises, async).`);
    answers.push(`Answer ${i}: ${answer}`);
  }
  console.log('Generated answers:', answers);
  console.log('Manually post these in GitHub Discussions and get them accepted (32 for GOLD).');
  achievementsStatus.GalaxyBrain = false; // Manual action required
}

/**
 * +---------------------+
 * | YOLO (DEFAULT)      |
 * +---------------------+
 * Merges a PR without review for the YOLO achievement.
 * @async
 * @returns {Promise<void>}
 */
async function achieveYolo() {
  if (achievementsStatus.YOLO) {
    console.log('YOLO: Already earned, skipping.');
    return;
  }
  const repoName = `yolo-repo-${Date.now()}`;
  console.log(`Creating repository: ${repoName}`);
  await octokit.repos.createForAuthenticatedUser({ name: repoName, auto_init: true });

  const { data: branchData } = await octokit.repos.getBranch({
    owner: USERNAME,
    repo: repoName,
    branch: 'main',
  });
  const mainCommitSha = branchData.commit.sha;

  await octokit.git.createRef({
    owner: USERNAME,
    repo: repoName,
    ref: 'refs/heads/yolo-branch',
    sha: mainCommitSha,
  });

  const { data: fileData } = await octokit.repos.getContent({
    owner: USERNAME,
    repo: repoName,
    path: 'README.md',
    ref: 'main',
  });
  const readmeSha = fileData.sha;

  await octokit.repos.createOrUpdateFileContents({
    owner: USERNAME,
    repo: repoName,
    path: 'README.md',
    message: 'YOLO commit',
    content: Buffer.from(await generateContent('Write a fun README content.')).toString('base64'),
    sha: readmeSha,
    branch: 'yolo-branch',
  });

  const pr = await octokit.pulls.create({
    owner: USERNAME,
    repo: repoName,
    title: 'YOLO PR',
    body: 'Merging without review!',
    head: 'yolo-branch',
    base: 'main',
  });

  await octokit.pulls.merge({
    owner: USERNAME,
    repo: repoName,
    pull_number: pr.data.number,
  });

  console.log('YOLO: Pull request merged without review (DEFAULT earned).');
  achievementsStatus.YOLO = true;
}

/**
 * +---------------------+
 * | Main Execution      |
 * +---------------------+
 * Runs all achievement functions to maximize GitHub profile achievements.
 * @async
 * @returns {Promise<void>}
 */
async function main() {
  try {
    console.log('Starting GitHub Achievements script to max out profile...');
    await achieveStarstruck();
    await achieveQuickdraw();
    await achievePullShark();
    await achieveGalaxyBrain();
    await achieveYolo();
    console.log('Script completed. Check your GitHub profile for achievements!');
    console.log('Current achievement status:', achievementsStatus);
    console.log('Next steps: Promote Starstruck repo for 4096 stars, post 32 Galaxy Brain answers.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
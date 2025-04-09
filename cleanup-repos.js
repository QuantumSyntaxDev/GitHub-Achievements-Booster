require('dotenv').config();
const { Octokit } = require('@octokit/rest');

/**
 * +---------------------+
 * | Environment Setup   |
 * +---------------------+
 * Loads sensitive credentials from the .env file for secure GitHub API access.
 */
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;       // GitHub Personal Access Token
const USERNAME = process.env.GITHUB_USERNAME;        // Your GitHub username

/**
 * +---------------------+
 * | GitHub API Client   |
 * +---------------------+
 * Initializes Octokit for interacting with GitHub's REST API using the provided token.
 */
const octokit = new Octokit({ auth: GITHUB_TOKEN });

/**
 * +---------------------+
 * | List Repositories   |
 * +---------------------+
 * Retrieves a list of repositories for the authenticated user.
 * @async
 * @returns {Promise<Array>} - Array of repository objects from GitHub API.
 */
async function listRepositories() {
  const response = await octokit.repos.listForAuthenticatedUser({
    per_page: 100, // Adjust if you have more than 100 repos
    sort: 'created',
    direction: 'desc',
  });
  return response.data;
}

/**
 * +---------------------+
 * | Delete Repository   |
 * +---------------------+
 * Deletes a specified repository owned by the authenticated user.
 * @async
 * @param {string} repoName - The name of the repository to delete.
 * @returns {Promise<void>}
 */
async function deleteRepository(repoName) {
  try {
    await octokit.repos.delete({
      owner: USERNAME,
      repo: repoName,
    });
    console.log(`Deleted repository: ${repoName}`);
  } catch (error) {
    console.error(`Error deleting ${repoName}:`, error.message);
  }
}

/**
 * +---------------------+
 * | Cleanup Repositories|
 * +---------------------+
 * Identifies and deletes repositories created by the achievements script based on name patterns.
 * @async
 * @returns {Promise<void>}
 */
async function cleanupRepositories() {
  try {
    console.log('Starting repository cleanup...');
    
    // Get all repositories
    const repos = await listRepositories();
    
    // Patterns to match repositories created by the achievements script
    const patterns = [
      /^starstruck-repo-\d+$/,
      /^quickdraw-repo-\d+$/,
      /^pullshark-repo-\d+$/,
      /^yolo-repo-\d+$/,
    ];

    // Filter repositories matching the patterns
    const reposToDelete = repos.filter(repo => 
      patterns.some(pattern => pattern.test(repo.name))
    );

    if (reposToDelete.length === 0) {
      console.log('No matching repositories found to delete.');
      return;
    }

    console.log(`Found ${reposToDelete.length} repositories to delete:`);
    reposToDelete.forEach(repo => console.log(`- ${repo.name}`));

    // Delete each matching repository
    for (const repo of reposToDelete) {
      await deleteRepository(repo.name);
    }

    console.log('Cleanup completed!');
  } catch (error) {
    console.error('Error during cleanup:', error.message);
  }
}

// Run the cleanup
cleanupRepositories();
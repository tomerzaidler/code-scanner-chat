import { CleanOptions, SimpleGit, SimpleGitOptions, simpleGit } from 'simple-git';
import { nanoid } from 'nanoid';
import fs from 'fs/promises';


export class GitProvider {
    private client: SimpleGit;
    private baseDir: string;
    constructor(baseDir: string, options: Partial<SimpleGitOptions> = {}) {
        this.baseDir = baseDir || '.clones';
        this.client = simpleGit(options);
    }

    public async clone(repoPath: string): Promise<string> {
        const name = this.extractRepoName(repoPath);
        const outputPath = `${this.baseDir}/${name}-${nanoid(8)}`;
        await this.client.clone(repoPath, outputPath);
        return outputPath;
    }

    private extractRepoName(repoUrl: string): string | null {
        // Regular expressions for both HTTPS and SSH URLs for GitHub
        const httpsRegex = /^(https?):\/\/(www\.)?github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)\.git$/;
        const sshRegex = /^git@github\.com:([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)\.git$/;

        // Check if the URL matches either HTTPS or SSH format
        const httpsMatch = repoUrl.match(httpsRegex);
        const sshMatch = repoUrl.match(sshRegex);

        if (httpsMatch) {
            // HTTPS URL: The fourth group in the regex contains the repository name
            return httpsMatch[4];
        } else if (sshMatch) {
            // SSH URL: The second group in the regex contains the username,
            // and the third group contains the repository name
            return sshMatch[3];
        } else {
            // Invalid Git repository URL
            return '';
        }
    }

    public async clean(path: string): Promise<void> {
        await fs.rm(path, { recursive: true, force: true })
    }

    public async cleanAll(): Promise<void> {
        await this.clean(this.baseDir);
    }
}
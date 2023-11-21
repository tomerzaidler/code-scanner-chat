import fs from 'fs';
import readline from 'readline';
import DataFrame, { Row } from "dataframe-js";
import * as fsWalk from '@nodelib/fs.walk';

export class FileScanner {
    private settings: fsWalk.Settings;

    constructor(includeFiles: string[] = [], excludeDirs: string[] = []) {
        this.settings = new fsWalk.Settings({
            deepFilter: this.setDirFilters(excludeDirs),
            entryFilter: this.setEntryFilters(includeFiles, excludeDirs)
        });
    }

    public setDirFilters(excludesDirs: string[] = []) {
        const deepFilter: fsWalk.DeepFilterFunction = (entry) => {
            let result = true;
            for (const dir of excludesDirs) {
                result = result && !entry.path.includes(dir);
            }
            return result;
        };
        return deepFilter;
    }

    public setEntryFilters(includeFiles: string[] = [], excludesDirs: string[] = []) {
        const entryFilter: fsWalk.EntryFilterFunction = (entry) => {
            let result = true;
            const stats = fs.lstatSync(entry.path);
            if (stats.isFile()) {
                const incldues = includeFiles.some(incldueFile => entry.name.endsWith(incldueFile));
                const excludes = excludesDirs.every(excludeFile => !entry.name.endsWith(excludeFile));
                result = result && incldues && excludes;
            } else if (stats.isDirectory()) {
                const excludes = excludesDirs.every(excludeFile => !entry.name.endsWith(excludeFile));
                result = result && excludes;
            }
            return result;
        };
        return entryFilter;
    }

    private async readFileByLine(path: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            try {
                const lines: string[] = [];
        
                const rl = readline.createInterface({
                  input: fs.createReadStream(path),
                  crlfDelay: Infinity,
                });
            
                rl.on('line', (line) => {
                    line = line.trim();
                    const alphanumericRegex = /[a-zA-Z0-9]+/;
                    const isValid = line && line.match(alphanumericRegex);
                    if(isValid) {
                        lines.push(line);
                    }
                });
            
                rl.on('close', () => {
                  resolve(lines);
                });
            
                rl.on('error', (err) => {
                    throw err;
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    public async scan(path: string): Promise<DataFrame> {
        return new Promise(async (res, rej) => {
            try {
                const fileList = fsWalk.walkSync(path, this.settings);
                let filesDataFrame = new DataFrame({
                    'path': [],
                    'code': [],
                    'embedding': [],
                    'cosine_similarity': [],
                }, ['path', 'code', 'embedding', 'cosine_similarity']);
                for (const file of fileList) {
                    const path = file.path;
                    if (fs.lstatSync(path).isFile()) {
                        console.log('reading file: ', path)
                        const code = fs.readFileSync(path, 'utf-8');
                        filesDataFrame = filesDataFrame.push(new Row({
                            'path': path,
                            'code': code,
                            'embedding': null,
                            'cosine_similarity': null,
                        }, ['path', 'code', 'embedding', 'cosine_similarity']));
                        // const lines = await this.readFileByLine(path);
                        // for (const line of lines) {
                        //     filesDataFrame = filesDataFrame.push(new Row({
                        //         'path': path,
                        //         'row': line,
                        //         'embedding': null,
                        //     }, ['path', 'row', 'embedding']));
                        // }
                    }
                }
                res(filesDataFrame);
            } catch (error) {
                rej(error);
            }
        });
    }
}
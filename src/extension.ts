/*****************************************************************************
 * Copyright (c) 2026 Sergey Naumenkov
 *
 * File:	extension.ts
 * Date		Created: 20.03.2026
 * Author:  Sergey Naumenkov
 * License: MIT (see LICENSE file for details)
 *
 * Description:
 *		Entry point file for extension
 *****************************************************************************/

import * as vscode from 'vscode';
import * as path from 'path';

/* Utils */
import { Logger } from './Utils/Logger';

/* Managers */
import { SolutionManager } from './Core/Managers/SolutionManager';
import { ProjectManager } from './Core/Managers/ProjectManager';
import { SolutionTreeProvider } from './UI/TreeView/SolutionTreeProvider';
import { TreeViewDataModel } from './Types/TreeViewSolutionData';
import { IProject } from './Models/Interfaces/IProject';
import { ISolution } from './Models/Interfaces/ISolution';
import { TreeViewSolutionDataBuilder } from './Core/TreeView/TreeViewSolutionBuilder';

/* 
	Entry point
*/
export async function activate(context: vscode.ExtensionContext) {
	Logger.LogToOutput('=========== Extension is activate! =========== ');

	if (!vscode.workspace.workspaceFolders?.length) {
		return;
	}

	const solutionFiles = await vscode.workspace.findFiles('**/*.slnx', '**/{node_modules,.git}/**', 2);
	if (solutionFiles.length !== 1) {
		const message = solutionFiles.length === 0
			? 'No .slnx solution was found in the current workspace.'
			: 'Multiple .slnx solutions were found. Open a workspace containing only the solution you want to load.';
		await vscode.window.showWarningMessage(`BuildBridge: ${message}`);
		return;
	}

	const solutionManager = new SolutionManager();
	const solution = await solutionManager.Load(solutionFiles[0].fsPath);

	let projects: IProject[] = [];
	const vsProjectManager = new ProjectManager();
	for (const project of solution.projects) {
		const projectPath = project.path.replace(/[\\/]/g, path.sep);
		const fullPath = path.resolve(path.dirname(solution.path), projectPath);
		const projectData = await vsProjectManager.Load(fullPath);

		projects.push(projectData);
	}

	const viewData = new TreeViewSolutionDataBuilder();
	const viewSolutionData = viewData.Build(solution, projects);

	/* Register our View Tree Data Provider */
	const provider = new SolutionTreeProvider();
	provider.LoadData(viewSolutionData);
	vscode.window.registerTreeDataProvider('buildbridge-solution-container-id', provider);
}

export function deactivate() { }

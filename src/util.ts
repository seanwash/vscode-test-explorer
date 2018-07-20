import * as vscode from 'vscode';
import { TestExplorer } from './testExplorer';
import { TreeNode } from './tree/treeNode';
import { TestNode } from './tree/testNode';

export function* allTests(treeNode: TreeNode): IterableIterator<TestNode> {
	if (treeNode.info.type === 'suite') {
		for (const child of treeNode.children) {
			yield* allTests(child);
		}
	} else {
		yield <TestNode>treeNode;
	}
}

export function runTestsInFile(file: string | undefined, testExplorer: TestExplorer): void {

	if (!file && vscode.window.activeTextEditor) {
		file = vscode.window.activeTextEditor.document.fileName;
	}

	if (file) {
		for (const collection of testExplorer.collections) {
			if (collection.suite) {
				const found = findFileNode(file, collection.suite);
				if (found) {
					testExplorer.run([ found ]);
					return;
				}
			}
		}
	}
}

function findFileNode(file: string, searchNode: TreeNode): TreeNode | undefined {

	if (searchNode.info.file) {

		if (searchNode.info.file === file) {
			return searchNode;
		} else {
			return undefined;
		}

	} else {

		for (const childNode of searchNode.children) {
			const found = findFileNode(file, childNode);
			if (found) {
				return found;
			}
		}
	}

	return undefined;
}

export function runTestAtCursor(testExplorer: TestExplorer): void {

	const editor = vscode.window.activeTextEditor;
	if (editor) {

		const nodes = findNodesLocatedAboveCursor(
			editor.document.fileName,
			editor.selection.active.line,
			testExplorer
		);

		if (nodes.length > 0) {
			testExplorer.run(nodes);
		}
	}
}

function findNodesLocatedAboveCursor(file: string, cursorLine: number, testExplorer: TestExplorer): TreeNode[] {

	let currentLine = -1;
	let currentNodes: TreeNode[] = [];

	for (const collection of testExplorer.collections) {

		const locatedNodes = collection.getLocatedNodes(file);
		if (locatedNodes) {
			
			for (const line of locatedNodes.keys()) {
				if ((line > cursorLine) || (line < currentLine)) continue;

				const lineNodes = locatedNodes.get(line)!;

				if (line === currentLine) {

					currentNodes.push(...lineNodes);

				} else { // line > currentLine

					currentLine = line;
					currentNodes = [...lineNodes];
				}
			}
		}
	}

	return currentNodes;
}

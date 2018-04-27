import { browser, ElementFinder } from 'protractor';

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

let mask_fn = require('./mask').MASK_FN;

/*
 * Create shim for LooksSame typing.
 */
export interface LooksSame {
	(img1: string, img2: string, options: Object, check: (error: any, equal: any) => void);

	(img1: string, img2: string, check: (error: any, equal: any) => void);

	createDiff(options: Object, err: Function);
}

let looksSame: LooksSame = require('looks-same');

export async function addMask(element: ElementFinder, color) {
	let size = await element.getSize();
	let location = await element.getLocation();
	await browser.executeScript(mask_fn, location.x, location.y, size.width, size.height, color);
}

export async function compareScreenshot(screenShot, referenceFolderName, referenceFileName) {
	let temporalFile = await createTemporalFile(screenShot);
	let referenceFile = referenceFolderName + path.sep + referenceFileName;

	const shouldUpdate = process.env['UPDATE_GOLDEN_IMAGES'] == "1" || process.env['UPDATE_GOLDEN_IMAGES'] === "true";
	if (shouldUpdate) {
		console.log('Create reference image.');
		fs.writeFileSync(referenceFile, fs.readFileSync(temporalFile));
		return true;
	} else {
		return new Promise<boolean>((resolve, reject) => {
			looksSame(temporalFile, referenceFile, {strict: false, tolerance: 2.5}, (error, equal) => {
				if (!equal) {
					looksSame.createDiff({
						reference:      referenceFile,
						current:        temporalFile,
						diff:           referenceFolderName + path.sep + 'diff' + path.sep + referenceFileName,
						highlightColor: '#ff00ff'
					}, (error) => {
						reject(`Screenshot do not match for ${referenceFile}.`);
					});
				} else {
					resolve(true);
				}
			});
		});
	}
}

async function createTemporalFile(data) {
	const temporalFolder = fs.mkdtempSync(`${os.tmpdir()}${path.sep}`);
	let temporalFile = path.join(temporalFolder, 'new.png');
	fs.writeFileSync(temporalFile, data, 'base64');
	return temporalFile;
}

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {browser, ElementFinder} from 'protractor';
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

export async function compareScreenshot(data, golden) {
  let screenshotPath = await writeScreenshot(data);
  const update = process.env['UPDATE_GOLDEN_IMAGES'] == "1" || process.env['UPDATE_GOLDEN_IMAGES'] === "true";
  if (update) {
    console.log('Create golden image.');
    fs.writeFileSync(golden, fs.readFileSync(screenshotPath));
    return true;
  } else {
    return new Promise<boolean>((resolve, reject) => {
      looksSame(screenshotPath, golden, {strict: false, tolerance: 2.5}, (error, equal) => {
        if (!equal) {
          looksSame.createDiff({
            reference: golden,
            current: screenshotPath,
            diff: 'diff.png',
            highlightColor: '#ff00ff'}, (error) => {
            reject(`Screenshots do not match for ${golden}.`);
          });
        } else {
          resolve(true);
        }
      });
    });
  }
}

async function writeScreenshot(data) {
  const folder = fs.mkdtempSync(`${os.tmpdir()}${path.sep}`);
  let screenshotFile = path.join(folder, 'new.png');
  fs.writeFileSync(screenshotFile, data, 'base64');
  return screenshotFile;
}

export async function addMask(el: ElementFinder, color) {  
  let size = await el.getSize();
  let location = await el.getLocation();
  await browser.executeScript(mask_fn, location.x, location.y, size.width, size.height, color);
}

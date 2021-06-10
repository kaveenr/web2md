import { Readability } from '@mozilla/readability';
import {Command, flags} from '@oclif/command'
import { writeFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import fetch from "node-fetch";
import TurndownService = require('turndown');

class Web2Md extends Command {
  static description = 'Convert Web Articles To Markdown'

  static flags = {
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    name: flags.string({char: 'o', description: 'output file path'}),
  }

  static args = [{name: 'url', required: true}]

  async run() {
    const {args, flags} = this.parse(Web2Md)
    const srcUrl = args["url"];

    // Get Page HTML
    const pageSource = await fetch(srcUrl);
    if (!pageSource.ok) {
      this.error(`Unable to fetch url ${srcUrl} responded with ${pageSource.status}`);
    }
    const pageHtml = await pageSource.text();
    
    // Make DOM
    const dom = new JSDOM(pageHtml,  {
      url: srcUrl
    });
    
    // Get Reader
    let reader = new Readability(dom.window.document);
    let article = reader.parse();

    if (!article) {
      this.error(`Unable to parse page`);
    }

    // Convert To Markdown
    var turndownService = new TurndownService()
    var markdown = turndownService.turndown(article.content);

    // Output Document
    const today = new Date().toISOString().slice(0, 10)
    const output = `# ${article.title}

*Author:* ${article.byline}
*Site Name:* ${article.siteName} 
*Url:* ${srcUrl}
*Extracted Date:* ${today}
---
${markdown}
    `
    // Output Document
    let outFile = flags.name || `${today}-${article.title}.md`

    this.log(`Writing to file ${outFile}`);
    writeFileSync(outFile, output, "utf-8");

  }
}

export = Web2Md

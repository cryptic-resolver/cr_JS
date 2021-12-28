#!/usr/bin/env node
//   ---------------------------------------------------
//   File          : cr.js
//   Authors       : ccmywish <ccmywish@qq.com>
//   Created on    : <2021-12-27>
//   Last modified : <2021-12-28>
// 
//   This file is used to explain a CRyptic command
//   or an acronym's real meaning in computer world or 
//   orther fileds.  
// 
//  ---------------------------------------------------

// require('toml')

const os = require("os");
const path = require("path");
const fs = require("fs");
const process = require("process");

const { execSync } = require("child_process");

const userHomeDir = os.homedir();

const CRYPTIC_RESOLVER_HOME = path.resolve(userHomeDir, "./.cryptic-resolver");
const CRYPTIC_DEFAULT_SHEETS = {
    'computer': "https://github.com/cryptic-resolver/cryptic_computer.git",
    'common': "https://github.com/cryptic-resolver/cryptic_common.git",
    'science': "https://github.com/cryptic-resolver/cryptic_science.git",
    'economy': "https://github.com/cryptic-resolver/cryptic_economy.git",
    'medicine': "https://github.com/cryptic-resolver/cryptic_medicine.git"
}


/*
    color function
*/

let bold = (str) => "\e[1m#{str}\e[0m";
let underline = (str) => "\e[4m#{str}\e[0m";
let red = (str) => "\e[31m#{str}\e[0m";
let green = (str) => "\e[32m#{str}\e[0m";
let yellow = (str) => "\e[33m#{str}\e[0m";
let blue = (str) => "\e[34m#{str}\e[0m";
let purple = (str) => "\e[35m#{str}\e[0m";
let cyan = (str) => "\e[36m#{str}\e[0m";


/*
    core logic
*/

function isDirEmpty(dirname) {
    return fs.promises.readdir(dirname).then(files => {
        return files.length === 0;
    });
}

function is_there_any_sheet() {
    if(fs.accessSync(CRYPTIC_RESOLVER_HOME, fs.constants.F_OK)){
        fs.mkdir(CRYPTIC_RESOLVER_HOME);
    }

    return !isDirEmpty(CRYPTIC_RESOLVER_HOME);
}

function add_default_sheet_if_none_exist() {
    if (is_there_any_sheet()) {
        console.log("cr: Adding default sheets...");

        Object.entries(CRYPTIC_DEFAULT_SHEETS).forEach((arr) => {
            let sheet = arr[1];
            execSync(`git -C ${CRYPTIC_RESOLVER_HOME} clone ${sheet}`);
        }
        )

        console.log("cr: Done");
    }
}


function update_sheets(sheet_repo) {
    if (is_there_any_sheet() == false) {
        return;
    }

    if (sheet_repo == undefined) {
        fs.readdirSync(CRYPTIC_RESOLVER_HOME, (err, files) => {
            if (err) {
                return console.log(err);
            }
            else {
                files.forEach(sheet => {
                    if (sheet.isDirectory()) {
                        console.log("cr: Wait to update #{sheet}...");
                        execSync(`git -C ${CRYPTIC_RESOLVER_HOME}/${sheet} pull`);
                    }
                })
            }
        });

    }
    else {
        execSync(`git -C #{CRYPTIC_RESOLVER_HOME} clone #{sheet_repo}`);
    }

    console.log("cr: Done");
}


function load_dictionary(path, file) {
    file = CRYPTIC_RESOLVER_HOME + `/${path}/${file}.toml`

    if (fs.accessSync(file, fs.constants.F_OK)){
        return Tomlrb.load_file(file);
    } else {
        return false;
    }
}


function pp_info(info) {
    let disp = info['disp'] || red("No name!");
    console.log("\n  #{disp}: #{info['desc']}");

    if (full = info['full']) {
        console.log("\n  ", full, "\n");
    }

    let see_also = info['see'];
    if (see_also) {
        console.log("\n", purple("SEE ALSO "));
        see_also.forEach(x => {
            console.log(underline(x), ' ')
        });
        console.log();
    }
    console.log();
}

// Print default cryptic_ sheets
function pp_sheet(sheet) {
    console.log(green(`From: ${sheet}`));
}




function directly_lookup(sheet, file, word) {
    let dict = load_dictionary(sheet, file.toLowerCase());

    let words = word.split('.');

    word = words.shift();

    let explain = words[0];

    if (explain == undefined) {
        let = info = dict[word];
    } else {
        let info = dict[word][explain];
    }

    // Warn user this is the toml maintainer's fault
    if (info == undefined) {
        console.log(
            red(`WARN: Synonym jumps to a wrong place at \`${word}\`
      Please consider fixing this in ${file.toLowerCase()}.toml\` of the sheet \`${sheet}\``));
    }

    pp_info(info);
    return true // always true
}



function lookup(sheet, file, word) {
    // Only one meaning
    let dict = load_dictionary(sheet, file);
    if (dict == undefined) {
        return false;
    }

    let info = dict[word] // Directly hash it
    if (info == undefined) {
        return false;
    }

    if (info.size == 0) {
        console.log(red(`WARN: Lack of everything of the given word 
        Please consider fixing this in the sheet\`${sheet}\``));
        process.exit();
    }

    // Check whether it's a synonym for anther word
    // If yes, we should lookup into this sheet again, but maybe with a different file
    let same = info['same'];
    if (same) {
        pp_sheet(sheet);
    }

    // point out to user, this is a jump
    console.log(blue(bold(word)) + ' redirects to ' + blue(bold(same)));

    if (same.charAt(0).toLowerCase() == file) {
        same = same.toLowerCase();
        info = dict[same];
        if (info == undefined) {
            console.log(
                red(`WARN: Synonym jumps to the wrong place \`${same}\`,
        Please consider fixing this in \`${file.toLowerCase()}.toml\` of the sheet\`${sheet}\``));
            process.exit();
            return false;
        } else {
            pp_info(info);
            return true;
        }
    } else {
        return directly_lookup(sheet, same.chr, same);
    }

    // Check if it's only one meaning
    if (info.has_key('desc')) {
        pp_sheet(sheet);
        pp_info(info);
        return true;
    }

    // Multiple meanings in one sheet
    info = info.keys

    if (info.empty()) {
        pp_sheet(sheet)
        info.forEach(meaning => {
            pp_info(dict[word][meaning])
            // last meaning doesn't show this separate line
            if (info.last != meaning) {
                console.log(blue(bold("OR")), "\n");
            }
            return true;
        })

    } else {
        return false
    }
}


function solve_word(word) {

    add_default_sheet_if_none_exist();

    word = word.toLowerCase();

    let index = word.charAt(0);

    if (index == [0 - 9]) {
        index = '0123456789'
    }

    let first_sheet = "cryptic_" + CRYPTIC_DEFAULT_SHEETS[0];

    // cache lookup results
    let results = [];
    results.push(lookup(first_sheet, index, word));

    // Then else
    let rest = Dir.children(CRYPTIC_RESOLVER_HOME);
    rest.delete(first_sheet);
    rest.forEach(sheet => {
        results << lookup(sheet, index, word)
    });

    if (!results.include(true)) {
        console.log(`
    cr: Not found anything.
    
    You may use \`cr -u\` to update the sheets.
    Or you could contribute to our sheets: Thanks!
    
      1. computer:   #{CRYPTIC_DEFAULT_SHEETS[:computer]}
      2. common:     #{CRYPTIC_DEFAULT_SHEETS[:common]}
      3. science:    #{CRYPTIC_DEFAULT_SHEETS[:science]}
      4. economy:    #{CRYPTIC_DEFAULT_SHEETS[:economy]}
      5. medicine:   #{CRYPTIC_DEFAULT_SHEETS[:medicine]}
    
    NotFound
    
      else
        return
      end`);

    }

}




function help() {
    console.log(`
cr: Cryptic Resolver. 

usage:
  cr -h                     => print this help
  cr -u (xx.com//repo.git)  => update default sheet or add sheet from a git repo
  cr emacs                  => Edit macros: a feature-rich editor
`
    )
}



function main() {
    process.argv.splice(0,2); // remove `node` command and file name
    let arg = process.argv.shift();
    switch (arg) {
        case undefined:
            help();
            add_default_sheet_if_none_exist();
            break;
        case '-h':
            help();
            break;
        case '-u':
            update_sheets(process.argv.shift());
            break;
        default:
            solve_word(arg);
    }
}

main();


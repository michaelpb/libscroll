#!/usr/bin/env node
const Jasmine = require('jasmine');
const SpecReporter = require('jasmine-spec-reporter');
const noop = () => {};

const jrunner = new Jasmine();
jrunner.configureDefaultReporter({print: noop});    // remove default reporter logs
//jrunner.configureDefaultReporter({print: console.log});    // remove default reporter logs
jasmine.getEnv().addReporter(new SpecReporter());   // add jasmine-spec-reporter
jrunner.loadConfigFile();                           // load jasmine.json configuration
jrunner.execute();

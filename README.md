# [PROJECT-NAME] v1.0.0 #
React boilerplate with:
- testing framework (Jest)
- state management example (Redux)
- routing (React Router v4)
- styles with scss
- helmet for document `<head>` management


# Table of contents #

* [Setup](#setup)
    * [System Dependencies](#system-dependencies)
    * [Init](#init)
* [Codebase](#codebase)
    * [Structure](#structure)
    * [NPM Scripts](#npm-scripts)
* [Code Contribution](#code-contribution)
    * [Guidelines](#guidelines)
    * [Branches](#branches)
* [Environments](#environments)
* [Project Context](#project-context)
    * [Details](#details)
    * [Team](#team)



## Setup ##

### System Dependencies ###

* [yarn](https://yarnpkg.com/en/) or [npm](https://www.npmjs.com/)
* [node]((https://nodejs.org/en/)) (min. 6.3.0)


### Init ###

* `yarn install` or `npm install`
* `yarn start` or `npm start`


## Codebase ##

### Structure ###
* **scripts/**: Contains the build, start & test scripts (see package.json for use)
* **src/**: Contains the React website logic.
* **config/**: Contains project-wide configuration properties.

### NPM Scripts ###

| Command       | Description                                 |
| ------------- |-------------------------------------------- |
| start         | Starts the dev server.                      |
| build         | Builds the bundle (and cleans the previous. |
| test          | Start the Jest test runner.                 |

All commands are executable by running `npm run [COMMAND-NAME]`.


## Code Contribution ##

### Guidelines ###


### Branches ###

We follow these naming conventions:

* **master**: Production-ready code.
* **develop**: Development code.
* **release/***: Snapshot of a release.
* **feature/***: For developing new features.
* **bugfix/***: For bugs that are logged during testing.
* **hotfix/***: Only for hotfixing critical bugs from the `master`-branch.




## Environments ##

### Development ###
The development environment receives automatic builds when code is contributed to the `development`-branch. This environment is expected to break from time to time and thus should be used for **internal testing only**!

**URL**: [https://bitbucket.org/district01/boilerplate/overview](https://bitbucket.org/district01/boilerplate/overview)

### Staging ###
The staging environment receives automatic builds when code is contributed to the `master`-branch. This environment is expected to remain stable and should be used for **client validation testing**.

**URL**: [https://bitbucket.org/district01/boilerplate/overview](https://bitbucket.org/district01/boilerplate/overview)

### Production ###
The production environment is built manually from the `master`-branch. This environment has to be **stable at all times**. No unvalidated code can be deployed on this environment.

**URL**: [https://bitbucket.org/district01/boilerplate/overview](https://bitbucket.org/district01/boilerplate/overview)



## Project Context ##
This project is a New-Media team effort.

### Details ###

* **Client**: Digipolis
* **Start**: 12/10/2017
* **Jira Board**: http://www.district01.be
* **Drive Folder**: http://www.district01.be
* **Project Sheet**: http://www.district01.be

### Team ###
List the team that has worked on this project, including the duration e.g.:

* [Developer 1 - District01](developer-1@district01.be)
    * **Function**: Lead Front-End Dev
    * **Period**: October 2017 -> December 2017
* [Developer 2 - District01](developer-2@district01.be)
    * **Function**: Lead Technical Dev
    * **Period**: October 2017 -> December 2017
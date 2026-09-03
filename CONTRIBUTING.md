# Contributing Workflow

To ensure code quality and prevent accidental changes to the production codebase, we follow a strict branching workflow.

**Important:** Direct pushes to the `main` branch are strictly prohibited. 

## Workflow Steps

Whenever you start working on a new feature, bug fix, or any other task, please follow these steps:

### 1. Create a New Branch
Before making any changes, create a new branch from `main`. Name your branch descriptively based on what you are working on (e.g., `feature/login-page`, `bugfix/data-loader`, `docs/readme-update`).

```bash
# Ensure you are on main and up to date
git checkout main
git pull origin main

# Create and switch to your new branch
git checkout -b <your-branch-name>
```

### 2. Make Changes and Commit
Make your code changes, test them, and commit them to your branch. Write clear and descriptive commit messages.

```bash
git add .
git commit -m "Brief description of your changes"
```

### 3. Push the Branch
Push your branch to the remote repository on GitHub.

```bash
git push -u origin <your-branch-name>
```

### 4. Create a Pull Request (PR)
Go to the repository on GitHub and open a Pull Request from your branch into the `main` branch. Review your changes, wait for any automated tests to pass, and merge the PR once it is approved.

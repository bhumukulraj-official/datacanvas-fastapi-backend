yarn add lodash --ignore-workspace-root-check

# Node.js, npm, and Yarn Guide

## Installation

### Node.js
1. **Installation Methods:**
   - Using nvm (Node Version Manager) - Recommended
     ```bash
     curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
     source ~/.bashrc
     nvm install --lts
     ```
   - Direct download from [nodejs.org](https://nodejs.org)
   - Using package managers (apt, yum, etc.)

2. **Verify Installation:**
   ```bash
   node --version
   npm --version
   ```

### npm (Node Package Manager)
- Comes bundled with Node.js
- Verify installation: `npm --version`
- Update npm: `npm install -g npm@latest`

### Yarn
1. **Installation:**
   ```bash
   npm install -g yarn
   ```
2. **Verify Installation:**
   ```bash
   yarn --version
   ```

## Package Management

### npm Commands
```bash
npm init                    # Initialize a new project
npm install <package>       # Install a package
npm install --save         # Install and save to dependencies
npm install --save-dev     # Install and save to devDependencies
npm update                 # Update all packages
npm audit                  # Check for security vulnerabilities
npm run <script>           # Run a script defined in package.json
```

### Yarn Commands
```bash
yarn init                  # Initialize a new project
yarn add <package>         # Install a package
yarn add --dev <package>   # Install as dev dependency
yarn upgrade               # Update all packages
yarn audit                # Check for security vulnerabilities
yarn <script>             # Run a script defined in package.json
```

## Common Issues and Solutions

### Node.js Issues

1. **Permission Errors**
   - Solution: Use `sudo` or fix permissions
   ```bash
   sudo chown -R $USER:$(id -gn $USER) ~/.config
   ```

2. **Memory Issues**
   - Solution: Increase Node.js memory limit
   ```bash
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

3. **Version Conflicts**
   - Solution: Use nvm to manage multiple Node.js versions
   ```bash
   nvm use <version>
   ```

### npm Issues

1. **Installation Failures**
   - Clear npm cache:
   ```bash
   npm cache clean --force
   ```
   - Delete node_modules and package-lock.json:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Global Package Issues**
   - Fix permissions:
   ```bash
   npm config set prefix ~/.npm-global
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
   source ~/.profile
   ```

3. **Network Issues**
   - Set npm registry:
   ```bash
   npm config set registry https://registry.npmjs.org/
   ```

### Yarn Issues

1. **Installation Failures**
   - Clear Yarn cache:
   ```bash
   yarn cache clean
   ```
   - Delete node_modules and yarn.lock:
   ```bash
   rm -rf node_modules yarn.lock
   yarn install
   ```

2. **Version Conflicts**
   - Use specific Yarn version:
   ```bash
   yarn policies set-version <version>
   ```

3. **Workspace Issues**
   - Ignore workspace root check:
   ```bash
   yarn add <package> --ignore-workspace-root-check
   ```

## Best Practices

1. **Version Control**
   - Always commit `package-lock.json` or `yarn.lock`
   - Use `.npmrc` or `.yarnrc` for configuration
   - Add `node_modules` to `.gitignore`

2. **Security**
   - Regularly run `npm audit` or `yarn audit`
   - Keep dependencies updated
   - Use `.npmignore` to exclude sensitive files

3. **Performance**
   - Use `npm ci` for CI/CD pipelines
   - Consider using `yarn workspaces` for monorepos
   - Use `.npmrc` to optimize installation

## Useful Commands

### Development
```bash
npm run dev              # Start development server
npm run build           # Build for production
npm run test            # Run tests
npm run lint            # Run linter
```

### Debugging
```bash
node --inspect <file>   # Start debugger
npm list --depth=0      # List installed packages
npm outdated            # Check for outdated packages
```

### Maintenance
```bash
npm prune               # Remove extraneous packages
npm dedupe             # Deduplicate dependencies
npm doctor             # Check npm environment
```

## Additional Resources

- [Node.js Documentation](https://nodejs.org/en/docs/)
- [npm Documentation](https://docs.npmjs.com/)
- [Yarn Documentation](https://yarnpkg.com/docs)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
#!/bin/bash
# Loomra Release Script
# This script automates the release process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_OWNER="MostafaWaleed0"
REPO_NAME="loomra"

# Check if version argument is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Version number required${NC}"
    echo "Usage: ./scripts/release.sh <version>"
    echo "Example: ./scripts/release.sh 1.0.0"
    exit 1
fi

VERSION=$1

# Validate version format (semantic versioning)
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?$ ]]; then
    echo -e "${RED}Error: Invalid version format${NC}"
    echo "Version must follow semantic versioning (e.g., 1.0.0 or 1.0.0-beta.1)"
    exit 1
fi

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Loomra Release Script v$VERSION        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if git is clean
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠ Warning: You have uncommitted changes${NC}"
    git status -s
    echo ""
    read -p "Do you want to continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}✗ Release cancelled${NC}"
        exit 1
    fi
fi

# Check if on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
    echo -e "${YELLOW}⚠ Warning: You are not on the main branch (current: $CURRENT_BRANCH)${NC}"
    read -p "Do you want to continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}✗ Release cancelled${NC}"
        exit 1
    fi
fi

# Check if tag already exists
if git rev-parse "v$VERSION" >/dev/null 2>&1; then
    echo -e "${RED}✗ Error: Tag v$VERSION already exists${NC}"
    exit 1
fi

# Update version in package.json
echo -e "${GREEN}➤ Updating package.json version...${NC}"
if command -v jq &> /dev/null; then
    # Using jq if available
    jq ".version = \"$VERSION\"" package.json > package.json.tmp
    mv package.json.tmp package.json
    echo -e "${GREEN}  ✓ Updated using jq${NC}"
else
    # Fallback to node
    node -e "const pkg = require('./package.json'); pkg.version = '$VERSION'; require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');"
    echo -e "${GREEN}  ✓ Updated using node${NC}"
fi

# Install dependencies
echo -e "${GREEN}➤ Installing dependencies...${NC}"
pnpm install --frozen-lockfile

# Build Next.js app
echo -e "${GREEN}➤ Building Next.js app...${NC}"
pnpm run build

# Run tests if available
if grep -q "\"test\":" package.json; then
    echo -e "${GREEN}➤ Running tests...${NC}"
    if pnpm test; then
        echo -e "${GREEN}  ✓ Tests passed${NC}"
    else
        echo -e "${RED}  ✗ Tests failed. Aborting release.${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ No tests found, skipping...${NC}"
fi

# Generate changelog entry
echo -e "${GREEN}➤ Generating changelog...${NC}"
CHANGELOG_ENTRY="## [${VERSION}] - $(date +%Y-%m-%d)

### Release Notes
- Version bump to ${VERSION}

"

# Prepend to CHANGELOG.md if it exists
if [ -f CHANGELOG.md ]; then
    echo "$CHANGELOG_ENTRY$(cat CHANGELOG.md)" > CHANGELOG.md
    git add CHANGELOG.md
    echo -e "${GREEN}  ✓ Updated CHANGELOG.md${NC}"
else
    echo -e "${YELLOW}  ⚠ CHANGELOG.md not found, skipping${NC}"
fi

# Commit version bump
echo -e "${GREEN}➤ Committing version bump...${NC}"
git add package.json pnpm-lock.yaml
if git diff --staged --quiet; then
    echo -e "${YELLOW}  ⚠ No changes to commit${NC}"
else
    git commit -m "chore: bump version to $VERSION"
    echo -e "${GREEN}  ✓ Committed changes${NC}"
fi

# Create git tag
echo -e "${GREEN}➤ Creating git tag v$VERSION...${NC}"
git tag -a "v$VERSION" -m "Release version $VERSION"
echo -e "${GREEN}  ✓ Tag created${NC}"

# Show summary before pushing
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}Release Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "Version:        ${GREEN}$VERSION${NC}"
echo -e "Branch:         ${GREEN}$CURRENT_BRANCH${NC}"
echo -e "Tag:            ${GREEN}v$VERSION${NC}"
echo -e "Repository:     ${GREEN}$REPO_OWNER/$REPO_NAME${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

read -p "Push changes and create release? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}✗ Release cancelled${NC}"
    echo -e "${YELLOW}⚠ To undo changes, run:${NC}"
    echo -e "  git tag -d v$VERSION"
    echo -e "  git reset --hard HEAD~1"
    exit 1
fi

# Push changes and tags
echo -e "${GREEN}➤ Pushing changes to remote...${NC}"
git push origin "$CURRENT_BRANCH"
echo -e "${GREEN}  ✓ Pushed branch${NC}"

echo -e "${GREEN}➤ Pushing tag to remote...${NC}"
git push origin "v$VERSION"
echo -e "${GREEN}  ✓ Pushed tag${NC}"

# Success message
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✓ Release Completed Successfully!    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo -e "1. GitHub Actions will automatically build and publish"
echo -e "2. Monitor progress at:"
echo -e "   ${BLUE}https://github.com/$REPO_OWNER/$REPO_NAME/actions${NC}"
echo -e "3. Release will be available at:"
echo -e "   ${BLUE}https://github.com/$REPO_OWNER/$REPO_NAME/releases/tag/v$VERSION${NC}"
echo ""

# Optional: Open pages
read -p "Open GitHub Actions page? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    URL="https://github.com/$REPO_OWNER/$REPO_NAME/actions"
    if command -v xdg-open &> /dev/null; then
        xdg-open "$URL"
    elif command -v open &> /dev/null; then
        open "$URL"
    elif command -v start &> /dev/null; then
        start "$URL"
    else
        echo -e "${BLUE}$URL${NC}"
    fi
fi
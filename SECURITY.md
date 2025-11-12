# Security Policy

## Supported Versions

**Platform Support:** Loomra officially supports Windows 10 and Windows 11 only. Other platforms are not tested or supported.

**Security Updates:** We provide security updates for the latest stable release. Older versions may not receive security patches.

| Version Type           | Supported                 |
| ---------------------- | ------------------------- |
| Latest Release         | :white_check_mark:        |
| Previous Minor Version | :warning: Limited support |
| Older Versions         | :x:                       |

We **strongly recommend** always using the latest version of Loomra to ensure you have:

- The most recent security patches
- Latest features and improvements
- Best performance and stability
- Full support and bug fixes

## Reporting a Vulnerability

We take the security of Loomra seriously. If you discover a security vulnerability, we appreciate your help in disclosing it to us responsibly.

### How to Report

**Please DO NOT report security vulnerabilities through public GitHub issues.**

Instead, please report security vulnerabilities by emailing:

**Email:** mw.dev500@gmail.com

### What to Include

When reporting a vulnerability, please include:

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** of the vulnerability
4. **Affected versions** (if known)
5. **Possible mitigation or fix** (if you have suggestions)
6. **Your contact information** for follow-up

### What to Expect

- **Acknowledgment:** You will receive an acknowledgment of your report within 48 hours
- **Communication:** We will keep you informed about the progress of fixing the vulnerability
- **Timeline:** We aim to address critical vulnerabilities within 7 days
- **Credit:** With your permission, we will credit you in the security advisory

## Security Best Practices for Users

### Application Security

- **Keep Updated:** Always use the latest version of Loomra
- **Verify Downloads:** Only download Loomra from official sources
- **Review Permissions:** Be aware of what system permissions the application requests

### Data Security

Loomra stores all data locally on your Windows device:

- **Local Storage:** Your data is stored in a local SQLite database
- **No Cloud Sync:** Your data never leaves your device
- **Backup Responsibility:** You are responsible for backing up your data
- **Database Location:** `%APPDATA%\loomra\` on Windows

### Privacy

- **No Telemetry:** Loomra does not collect or send any usage data
- **No Analytics:** We do not track your usage
- **No Third-Party Services:** The application does not connect to external services

## Security Measures

Loomra implements several security measures:

### Application Level

- **Tauri 2 Security:** Built on Tauri's secure architecture with latest security features
- **Command Isolation:** Frontend cannot directly access system resources
- **CSP Headers:** Strict Content Security Policy headers are enforced
- **No Remote Code:** Application does not execute remote code
- **Asset Protocol:** Secure asset loading scoped to `$APPDATA` directory
- **Signed Updates:** All updates are cryptographically signed for integrity verification

### Database Security

- **Prepared Statements:** All database queries use prepared statements to prevent SQL injection
- **Local Access Only:** Database is only accessible by the application
- **No Network Access:** Database does not accept network connections

### Build Security

- **Verified Dependencies:** All dependencies are from trusted sources
- **Reproducible Builds:** Build process is automated via GitHub Actions
- **Code Signing:** Builds are signed with Tauri signing keys for security
- **CI/CD Pipeline:** All releases go through automated checks

## Known Security Considerations

### Local File Access

- Loomra has scoped access to your local filesystem through Tauri's FS plugin
- File access is restricted to `$APPDATA/*` (application data directory only)
- Only specific, defined Tauri commands can access files
- No access to files outside the application's data directory
- All file operations go through secure Tauri commands

### Updates

Loomra includes a built-in auto-updater:

- **Automatic Updates:** The app checks for updates on launch
- **Secure Updates:** All updates are cryptographically signed
- **User Control:** Update dialogs allow you to choose when to install
- **GitHub Releases:** Updates are distributed through official GitHub releases
- **Update Verification:** The app verifies update signatures before installation

**Update Public Key:** Updates are signed and verified using the following public key:

```
dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDQyMTgxODUzNkNBNkJCQjQKUldTMHU2WnNVeGdZUXJjeVpWaUZFZy8yNHJXMjVyOEhCdXNUanpPU0hBZzVZdmRCSktwTHM4SjUK
```

**Manual Updates:** You can also download releases directly from the [official GitHub repository](https://github.com/MostafaWaleed0/loomra/releases).

## Security Updates

Security updates will be:

- Released as soon as possible after discovery
- Documented in release notes
- Announced through GitHub releases

## Disclosure Policy

- **Responsible Disclosure:** We follow responsible disclosure practices
- **Public Disclosure:** Vulnerabilities will be publicly disclosed after a fix is available
- **Security Advisories:** Critical vulnerabilities will have GitHub Security Advisories

## Bug Bounty Program

Currently, Loomra does not have a formal bug bounty program. However, we deeply appreciate security researchers who help make Loomra more secure.

## Contact

For security-related inquiries:

**Email:** mw.dev500@gmail.com
**GitHub:** [@MostafaWaleed0](https://github.com/MostafaWaleed0)

For general issues (non-security), please use GitHub Issues.

---

**Last Updated:** November 2025

Thank you for helping keep Loomra and its users safe!

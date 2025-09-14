import { logger } from '@/lib/logger';
import { readFileSync } from 'fs';
import { join } from 'path';

// Security vulnerability levels
export enum VulnerabilityLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MODERATE = 'MODERATE',
  LOW = 'LOW',
  INFO = 'INFO'
}

// Package audit result
interface PackageAudit {
  name: string;
  version: string;
  vulnerabilities: Vulnerability[];
  isOutdated: boolean;
  latestVersion?: string;
  directDependency: boolean;
}

interface Vulnerability {
  id: string;
  title: string;
  severity: VulnerabilityLevel;
  cves: string[];
  description: string;
  recommendation: string;
  patchedVersions?: string;
}

// Package metadata
interface PackageInfo {
  name: string;
  version: string;
  license: string;
  description?: string;
  maintainers: string[];
  lastPublished: string;
  dependencies?: Record<string, string>;
}

// Critical packages that require special attention
const CRITICAL_PACKAGES = [
  'next',
  'react',
  'react-dom',
  'jsonwebtoken',
  'bcryptjs',
  '@types/jsonwebtoken',
  'zod',
  'typescript'
];

// Packages with known security implications
const SECURITY_SENSITIVE_PACKAGES = [
  'jsonwebtoken',
  'bcryptjs',
  'crypto',
  'node-fetch',
  'axios',
  'express',
  'cors',
  'helmet'
];

// License compatibility matrix
const LICENSE_COMPATIBILITY = {
  'MIT': ['ISC', 'BSD-3-Clause', 'BSD-2-Clause', 'Apache-2.0'],
  'ISC': ['MIT', 'BSD-3-Clause', 'BSD-2-Clause', 'Apache-2.0'],
  'Apache-2.0': ['MIT', 'ISC', 'BSD-3-Clause', 'BSD-2-Clause'],
  'BSD-3-Clause': ['MIT', 'ISC', 'Apache-2.0'],
  'BSD-2-Clause': ['MIT', 'ISC', 'Apache-2.0']
};

interface PackageJson {
  name: string;
  version: string;
  license?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  [key: string]: unknown; // For other properties
}

interface PackageLock {
  name: string;
  version: string;
  packages?: Record<string, PackageLockInfo>;
  [key: string]: unknown; // For other properties
}

interface PackageLockInfo {
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  [key: string]: unknown; // For other properties
}

interface PackageVersionInfo {
  current: string;
  latest: string;
  severity: string;
}

export class DependencySecurityManager {
  private packageJsonPath: string;
  private lockfilePath: string;
  private packageJson!: PackageJson;
  private lockfile!: PackageLock | null;

  constructor(projectRoot: string = process.cwd()) {
    this.packageJsonPath = join(projectRoot, 'package.json');
    this.lockfilePath = join(projectRoot, 'package-lock.json');
    this.loadPackageFiles();
  }

  private loadPackageFiles(): void {
    try {
      const packageJsonContent = readFileSync(this.packageJsonPath, 'utf-8');
      this.packageJson = JSON.parse(packageJsonContent) as PackageJson;
      
      try {
        const lockFileContent = readFileSync(this.lockfilePath, 'utf-8');
        this.lockfile = JSON.parse(lockFileContent) as PackageLock;
      } catch (error) {
        logger.warn('Package lock file not found or invalid, some features will be limited');
        this.lockfile = null;
      }
    } catch (error) {
      logger.error('Failed to load package.json:', error as Record<string, unknown>);
      throw new Error('Cannot perform dependency security audit without package.json');
    }
  }

  // Get all dependencies (direct and transitive)
  getAllDependencies(): Map<string, string> {
    const deps = new Map<string, string>();
    
    // Direct dependencies
    const directDeps = {
      ...this.packageJson.dependencies,
      ...this.packageJson.devDependencies,
      ...this.packageJson.peerDependencies,
      ...this.packageJson.optionalDependencies
    };

    for (const [name, version] of Object.entries(directDeps)) {
      deps.set(name, version as string);
    }

    // Transitive dependencies from lockfile
    if (this.lockfile?.packages) {
      for (const [path, info] of Object.entries(this.lockfile.packages)) {
        if (path.startsWith('node_modules/')) {
          const name = path.replace('node_modules/', '');
          if (!deps.has(name) && (info as PackageLockInfo).version) {
            deps.set(name, (info as PackageLockInfo).version as string);
          }
        }
      }
    }

    return deps;
  }

  // Identify outdated packages
  async identifyOutdatedPackages(): Promise<Map<string, PackageVersionInfo>> {
    const outdated = new Map<string, PackageVersionInfo>();
    const dependencies = this.getAllDependencies();

    logger.info('Checking for outdated packages...');

    // Simulate package version checking (in real implementation, would use npm API)
    const criticalPackages = Array.from(dependencies.keys()).filter(name => 
      CRITICAL_PACKAGES.includes(name)
    );

    for (const pkg of criticalPackages) {
      const currentVersion = dependencies.get(pkg);
      if (currentVersion) {
        // Simulate version checking logic
        const isOutdated = this.simulateOutdatedCheck(pkg, currentVersion);
        if (isOutdated.outdated) {
          outdated.set(pkg, {
            current: currentVersion,
            latest: isOutdated.latest,
            severity: CRITICAL_PACKAGES.includes(pkg) ? 'HIGH' : 'MODERATE'
          });
        }
      }
    }

    return outdated;
  }

  private simulateOutdatedCheck(packageName: string, currentVersion: string): { outdated: boolean; latest: string } {
    // Simplified version comparison simulation
    // In real implementation, would fetch from npm registry
    const versionNumber = currentVersion.replace(/[^\d.]/g, '');
    const versionParts = versionNumber.split('.').map(Number);
    const major = versionParts[0] ?? 0;
    const minor = versionParts[1] ?? 0;
    const patch = versionParts[2] ?? 0;
    
    // Simulate newer versions for demonstration
    const packageVersions: Record<string, string> = {
      'next': '15.5.4',
      'react': '19.1.2',
      'typescript': '5.9.3',
      'jsonwebtoken': '9.0.3',
      'zod': '3.25.77'
    };

    const latestVersion = packageVersions[packageName] ?? `${major}.${minor}.${patch + 1}`;
    return {
      outdated: currentVersion !== latestVersion,
      latest: latestVersion
    };
  }

  // Check for known vulnerabilities
  async scanForVulnerabilities(): Promise<Map<string, Vulnerability[]>> {
    const vulnerabilities = new Map<string, Vulnerability[]>();
    const dependencies = this.getAllDependencies();

    logger.info('Scanning for known vulnerabilities...');

    // Simulated vulnerability database (in real implementation, would use npm audit API)
    const knownVulnerabilities: Record<string, Vulnerability[]> = {
      'jsonwebtoken': [
        {
          id: 'CVE-2022-23529',
          title: 'jsonwebtoken vulnerable to signature verification bypass',
          severity: VulnerabilityLevel.HIGH,
          cves: ['CVE-2022-23529'],
          description: 'Versions of jsonwebtoken before 9.0.0 are vulnerable to signature verification bypass.',
          recommendation: 'Update to jsonwebtoken version 9.0.0 or higher',
          patchedVersions: '>=9.0.0'
        }
      ]
    };

    for (const [packageName, version] of dependencies) {
      if (knownVulnerabilities[packageName]) {
        const pkgVulns = knownVulnerabilities[packageName].filter(vuln => 
          this.isVersionVulnerable(version, vuln.patchedVersions)
        );
        
        if (pkgVulns.length > 0) {
          vulnerabilities.set(packageName, pkgVulns);
        }
      }
    }

    return vulnerabilities;
  }

  private isVersionVulnerable(currentVersion: string, patchedVersions?: string): boolean {
    if (!patchedVersions) return true;
    
    // Simplified version comparison
    const cleanCurrent = currentVersion.replace(/[^\d.]/g, '');
    const cleanPatched = patchedVersions.replace(/[^\d.]/g, '').replace('>=', '');
    
    const currentParts = cleanCurrent.split('.').map(Number);
    const patchedParts = cleanPatched.split('.').map(Number);
    
    const cMajor = currentParts[0] ?? 0;
    const cMinor = currentParts[1] ?? 0;
    const cPatch = currentParts[2] ?? 0;
    const pMajor = patchedParts[0] ?? 0;
    const pMinor = patchedParts[1] ?? 0;
    const pPatch = patchedParts[2] ?? 0;
    
    if (cMajor < pMajor) return true;
    if (cMajor > pMajor) return false;
    if (cMinor < pMinor) return true;
    if (cMinor > pMinor) return false;
    return cPatch < pPatch;
  }

  // Analyze license compatibility
  analyzeLicenseCompatibility(): { compatible: string[]; incompatible: string[]; unknown: string[] } {
    const result = {
      compatible: [] as string[],
      incompatible: [] as string[],
      unknown: [] as string[]
    };

    const dependencies = this.getAllDependencies();
    const projectLicense = this.packageJson.license ?? 'MIT';

    for (const [packageName] of dependencies) {
      // Simulate license detection (in real implementation, would check package metadata)
      const packageLicense = this.simulateGetPackageLicense(packageName);
      
      if (!packageLicense) {
        result.unknown.push(packageName);
      } else if (this.isLicenseCompatible(projectLicense, packageLicense)) {
        result.compatible.push(packageName);
      } else {
        result.incompatible.push(packageName);
      }
    }

    return result;
  }

  private simulateGetPackageLicense(packageName: string): string | null {
    // Common licenses for popular packages
    const commonLicenses: Record<string, string> = {
      'react': 'MIT',
      'next': 'MIT',
      'typescript': 'Apache-2.0',
      'zod': 'MIT',
      'jsonwebtoken': 'MIT',
      'bcryptjs': 'MIT'
    };

    return commonLicenses[packageName] ?? 'MIT'; // Default to MIT for simulation
  }

  private isLicenseCompatible(projectLicense: string, packageLicense: string): boolean {
    if (projectLicense === packageLicense) return true;
    
    const compatibleLicenses = LICENSE_COMPATIBILITY[projectLicense as keyof typeof LICENSE_COMPATIBILITY];
    return compatibleLicenses ? compatibleLicenses.includes(packageLicense) : false;
  }

  // Identify potential vendor lock-in risks
  identifyVendorLockIn(): { high: string[]; medium: string[]; low: string[] } {
    const dependencies = this.getAllDependencies();
    const vendorRisk = {
      high: [] as string[],
      medium: [] as string[],
      low: [] as string[]
    };

    // Vendor-specific packages that create lock-in
    const vendorPackages = {
      high: [
        '@vercel/analytics',
        '@vercel/edge-config',
        'aws-sdk',
        '@aws-sdk',
        'firebase',
        '@firebase',
        'mongodb',
        'mongoose'
      ],
      medium: [
        'stripe',
        'paypal',
        'mailgun',
        'sendgrid',
        'twilio',
        'cloudflare'
      ]
    };

    for (const [packageName] of dependencies) {
      if (vendorPackages.high.some(vendor => packageName.includes(vendor))) {
        vendorRisk.high.push(packageName);
      } else if (vendorPackages.medium.some(vendor => packageName.includes(vendor))) {
        vendorRisk.medium.push(packageName);
      } else {
        vendorRisk.low.push(packageName);
      }
    }

    return vendorRisk;
  }

  // Generate comprehensive security report
  async generateSecurityReport(): Promise<{
    summary: {
      totalDependencies: number;
      directDependencies: number;
      vulnerabilities: number;
      outdatedPackages: number;
      licenseIssues: number;
      vendorLockIn: number;
    };
    vulnerabilities: Map<string, Vulnerability[]>;
    outdatedPackages: Map<string, PackageVersionInfo>;
    licenseAnalysis: { compatible: string[]; incompatible: string[]; unknown: string[] };
    vendorAnalysis: { high: string[]; medium: string[]; low: string[] };
    recommendations: string[];
  }> {
    logger.info('🔍 Generating comprehensive dependency security report...');

    const allDeps = this.getAllDependencies();
    const directDeps = Object.keys({
      ...this.packageJson.dependencies,
      ...this.packageJson.devDependencies
    });

    const [vulnerabilities, outdatedPackages, licenseAnalysis, vendorAnalysis] = await Promise.all([
      this.scanForVulnerabilities(),
      this.identifyOutdatedPackages(),
      Promise.resolve(this.analyzeLicenseCompatibility()),
      Promise.resolve(this.identifyVendorLockIn())
    ]);

    const recommendations: string[] = [];

    // Generate recommendations
    if (vulnerabilities.size > 0) {
      recommendations.push(`Update ${vulnerabilities.size} packages with known vulnerabilities`);
    }

    if (outdatedPackages.size > 0) {
      recommendations.push(`Update ${outdatedPackages.size} outdated packages`);
    }

    if (licenseAnalysis.incompatible.length > 0) {
      recommendations.push(`Review ${licenseAnalysis.incompatible.length} packages with incompatible licenses`);
    }

    if (vendorAnalysis.high.length > 0) {
      recommendations.push(`Consider alternatives for ${vendorAnalysis.high.length} high vendor lock-in packages`);
    }

    const summary = {
      totalDependencies: allDeps.size,
      directDependencies: directDeps.length,
      vulnerabilities: Array.from(vulnerabilities.values()).flat().length,
      outdatedPackages: outdatedPackages.size,
      licenseIssues: licenseAnalysis.incompatible.length + licenseAnalysis.unknown.length,
      vendorLockIn: vendorAnalysis.high.length + vendorAnalysis.medium.length
    };

    logger.info('📊 Security report generated', summary);

    return {
      summary,
      vulnerabilities,
      outdatedPackages,
      licenseAnalysis,
      vendorAnalysis,
      recommendations
    };
  }

  // Automated dependency updates (simulation)
  async performAutomatedUpdates(options: {
    updateLevel: 'patch' | 'minor' | 'major';
    excludePackages?: string[];
    dryRun?: boolean;
  } = { updateLevel: 'patch', dryRun: true }): Promise<{
    updatesApplied: string[];
    updatesFailed: string[];
    updatesSkipped: string[];
  }> {
    const { updateLevel, excludePackages = [], dryRun = true } = options;
    
    logger.info(`${dryRun ? 'Simulating' : 'Performing'} automated dependency updates...`);

    const outdatedPackages = await this.identifyOutdatedPackages();
    const result = {
      updatesApplied: [] as string[],
      updatesFailed: [] as string[],
      updatesSkipped: [] as string[]
    };

    for (const [packageName, info] of outdatedPackages) {
      if (excludePackages.includes(packageName)) {
        result.updatesSkipped.push(packageName);
        continue;
      }

      // Determine if update is allowed based on level
      const shouldUpdate = this.shouldUpdatePackage(info?.current ?? '', info?.latest ?? '', updateLevel);
      
      if (shouldUpdate) {
        if (dryRun) {
          logger.info(`Would update ${packageName}: ${info?.current ?? ''} → ${info?.latest ?? ''}`);
          result.updatesApplied.push(`${packageName}@${info?.latest ?? ''}`);
        } else {
          // In real implementation, would execute npm update command
          logger.info(`Updating ${packageName}: ${info?.current ?? ''} → ${info?.latest ?? ''}`);
          result.updatesApplied.push(`${packageName}@${info?.latest ?? ''}`);
        }
      } else {
        result.updatesSkipped.push(packageName);
      }
    }

    return result;
  }

  private shouldUpdatePackage(current: string, latest: string, level: 'patch' | 'minor' | 'major'): boolean {
    const currentParts = current.replace(/[^\d.]/g, '').split('.').map(Number);
    const latestParts = latest.replace(/[^\d.]/g, '').split('.').map(Number);
    
    const cMajor = currentParts[0] ?? 0;
    const cMinor = currentParts[1] ?? 0;
    const cPatch = currentParts[2] ?? 0;
    const lMajor = latestParts[0] ?? 0;
    const lMinor = latestParts[1] ?? 0;
    const lPatch = latestParts[2] ?? 0;

    switch (level) {
      case 'patch':
        return cMajor === lMajor && cMinor === lMinor && cPatch < lPatch;
      case 'minor':
        return cMajor === lMajor && (cMinor < lMinor || (cMinor === lMinor && cPatch < lPatch));
      case 'major':
        return true;
      default:
        return false;
    }
  }

  // Monitor for new vulnerabilities
  setupVulnerabilityMonitoring(): void {
    logger.info('🛡️ Setting up vulnerability monitoring...');
    
    // In real implementation, would set up periodic checking
    setInterval(async () => {
      try {
        const vulnerabilities = await this.scanForVulnerabilities();
        if (vulnerabilities.size > 0) {
          logger.warn('🚨 New vulnerabilities detected!', {
            packages: Array.from(vulnerabilities.keys()),
            count: Array.from(vulnerabilities.values()).flat().length
          });
        }
      } catch (error) {
        logger.error('Error in vulnerability monitoring:', error as Record<string, unknown>);
      }
    }, 24 * 60 * 60 * 1000); // Daily check
  }
}

// Singleton instance
let dependencyManager: DependencySecurityManager | null = null;

export function getDependencyManager(): DependencySecurityManager {
  dependencyManager ??= new DependencySecurityManager();
  return dependencyManager;
}

// Startup security check
export async function performStartupSecurityCheck(): Promise<void> {
  try {
    const manager = getDependencyManager();
    const report = await manager.generateSecurityReport();
    
    const criticalVulns = Array.from(report.vulnerabilities.values())
      .flat()
      .filter(v => v.severity === VulnerabilityLevel.CRITICAL || v.severity === VulnerabilityLevel.HIGH);

    if (criticalVulns.length > 0) {
      logger.error('🚨 Critical security vulnerabilities detected!', {
        count: criticalVulns.length,
        packages: Array.from(report.vulnerabilities.keys())
      } as Record<string, unknown>);

      // In production, consider failing startup
      if (process.env.NODE_ENV === 'production' && process.env.FAIL_ON_SECURITY_ISSUES === 'true') {
        process.exit(1);
      }
    } else {
      logger.info('✅ No critical security vulnerabilities detected');
    }
  } catch (error) {
    logger.error('Failed to perform startup security check:', error as Record<string, unknown>);
  }
}

const dependencySecurityModule = {
  DependencySecurityManager,
  getDependencyManager,
  performStartupSecurityCheck,
  VulnerabilityLevel,
};

export default dependencySecurityModule;

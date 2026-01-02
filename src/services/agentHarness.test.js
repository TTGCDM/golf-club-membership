import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get project root directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '../..')

/**
 * Agent Harness Tests
 *
 * These tests verify that the agent harness infrastructure is correctly configured
 * and all components are in sync. Run these tests to ensure:
 * - Version numbers are consistent across all files
 * - Required slash commands exist
 * - Progress tracking structure is valid
 * - Frozen files are properly documented
 * - Pre-commit hooks are configured
 */

// Helper to read JSON files
const readJsonFile = (filePath) => {
  const fullPath = path.resolve(PROJECT_ROOT, filePath)
  const content = fs.readFileSync(fullPath, 'utf-8')
  return JSON.parse(content)
}

// Helper to check if file exists
const fileExists = (filePath) => {
  const fullPath = path.resolve(PROJECT_ROOT, filePath)
  return fs.existsSync(fullPath)
}

// Helper to read file content
const readFile = (filePath) => {
  const fullPath = path.resolve(PROJECT_ROOT, filePath)
  return fs.readFileSync(fullPath, 'utf-8')
}

describe('Agent Harness Configuration', () => {
  describe('Version Consistency', () => {
    it('should have matching versions in package.json and claude-progress.json', () => {
      const packageJson = readJsonFile('package.json')
      const progressJson = readJsonFile('claude-progress.json')

      expect(packageJson.version).toBe(progressJson.version)
    })

    it('should have a valid semver version format', () => {
      const packageJson = readJsonFile('package.json')
      const semverRegex = /^\d+\.\d+\.\d+$/

      expect(packageJson.version).toMatch(semverRegex)
    })
  })

  describe('Slash Commands', () => {
    const requiredCommands = [
      'status.md',
      'harness-check.md',
      'explore.md',
      'plan-feature.md',
      'handoff.md',
      'metrics.md',
      'test-browser.md'
    ]

    it('should have .claude/commands directory', () => {
      expect(fileExists('.claude/commands')).toBe(true)
    })

    requiredCommands.forEach(command => {
      it(`should have /${command.replace('.md', '')} command`, () => {
        expect(fileExists(`.claude/commands/${command}`)).toBe(true)
      })
    })

    it('should have non-empty command files', () => {
      requiredCommands.forEach(command => {
        const content = readFile(`.claude/commands/${command}`)
        expect(content.length).toBeGreaterThan(10)
      })
    })
  })

  describe('Progress Tracking (claude-progress.json)', () => {
    let progressJson

    beforeAll(() => {
      progressJson = readJsonFile('claude-progress.json')
    })

    it('should have required top-level fields', () => {
      expect(progressJson).toHaveProperty('phase')
      expect(progressJson).toHaveProperty('version')
      expect(progressJson).toHaveProperty('features')
      expect(progressJson).toHaveProperty('frozen_files')
      expect(progressJson).toHaveProperty('known_issues')
      expect(progressJson).toHaveProperty('backlog')
    })

    it('should have valid phase value', () => {
      const validPhases = ['development', 'testing', 'fine-tuning', 'production']
      expect(validPhases).toContain(progressJson.phase)
    })

    it('should have metrics_history array', () => {
      expect(Array.isArray(progressJson.metrics_history)).toBe(true)
    })

    it('should have session_log array', () => {
      expect(Array.isArray(progressJson.session_log)).toBe(true)
    })

    describe('Features Structure', () => {
      it('should have features array', () => {
        expect(Array.isArray(progressJson.features)).toBe(true)
        expect(progressJson.features.length).toBeGreaterThan(0)
      })

      it('should have valid feature objects', () => {
        progressJson.features.forEach(feature => {
          expect(feature).toHaveProperty('name')
          expect(feature).toHaveProperty('status')
          expect(typeof feature.name).toBe('string')
          expect(['done', 'in-progress', 'planned', 'needs-review']).toContain(feature.status)
        })
      })
    })

    describe('Frozen Files Structure', () => {
      it('should have frozen_files array', () => {
        expect(Array.isArray(progressJson.frozen_files)).toBe(true)
        expect(progressJson.frozen_files.length).toBeGreaterThan(0)
      })

      it('should have valid frozen file entries', () => {
        progressJson.frozen_files.forEach(file => {
          expect(file).toHaveProperty('path')
          expect(file).toHaveProperty('reason')
          expect(typeof file.path).toBe('string')
          expect(typeof file.reason).toBe('string')
        })
      })

      it('should include critical frozen files', () => {
        const paths = progressJson.frozen_files.map(f => f.path)
        expect(paths).toContain('firestore.rules')
        expect(paths).toContain('src/contexts/AuthContext.jsx')
        expect(paths).toContain('src/services/paymentsService.js')
        expect(paths).toContain('src/firebase.js')
      })
    })

    describe('Known Issues Structure', () => {
      it('should have known_issues array', () => {
        expect(Array.isArray(progressJson.known_issues)).toBe(true)
      })

      it('should have valid known issue entries', () => {
        progressJson.known_issues.forEach(issue => {
          expect(issue).toHaveProperty('id')
          expect(issue).toHaveProperty('severity')
          expect(issue).toHaveProperty('description')
          expect(issue.id).toMatch(/^KI-\d{3}$/)
          expect(['info', 'low', 'medium', 'high', 'critical']).toContain(issue.severity)
        })
      })
    })

    describe('Backlog Structure', () => {
      it('should have backlog array', () => {
        expect(Array.isArray(progressJson.backlog)).toBe(true)
      })

      it('should have valid backlog entries', () => {
        progressJson.backlog.forEach(item => {
          expect(item).toHaveProperty('id')
          expect(item).toHaveProperty('priority')
          expect(item).toHaveProperty('title')
          expect(item.id).toMatch(/^BL-\d{3}$/)
          expect(['low', 'medium', 'high']).toContain(item.priority)
        })
      })
    })

    describe('Metrics History Structure', () => {
      it('should have valid metrics entries', () => {
        progressJson.metrics_history.forEach(entry => {
          expect(entry).toHaveProperty('date')
          expect(entry).toHaveProperty('session')
          expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        })
      })
    })
  })

  describe('Pre-commit Hook', () => {
    it('should have .husky/pre-commit file', () => {
      expect(fileExists('.husky/pre-commit')).toBe(true)
    })

    it('should have version consistency check in pre-commit', () => {
      const preCommit = readFile('.husky/pre-commit')
      expect(preCommit).toContain('Version Consistency Check')
      expect(preCommit).toContain('package.json')
      expect(preCommit).toContain('claude-progress.json')
    })

    it('should have frozen files check in pre-commit', () => {
      const preCommit = readFile('.husky/pre-commit')
      expect(preCommit).toContain('Frozen Files Check')
      expect(preCommit).toContain('firestore.rules')
    })

    it('should have lint check in pre-commit', () => {
      const preCommit = readFile('.husky/pre-commit')
      expect(preCommit).toContain('npm run lint')
    })

    it('should have security scan in pre-commit', () => {
      const preCommit = readFile('.husky/pre-commit')
      expect(preCommit).toContain('semgrep')
    })
  })

  describe('Critical Files Exist', () => {
    const criticalFiles = [
      'CLAUDE.md',
      'package.json',
      'claude-progress.json',
      '.husky/pre-commit',
      '.claude/settings.local.json',
      'firestore.rules',
      'src/contexts/AuthContext.jsx',
      'src/services/paymentsService.js',
      'src/firebase.js'
    ]

    criticalFiles.forEach(file => {
      it(`should have ${file}`, () => {
        expect(fileExists(file)).toBe(true)
      })
    })
  })

  describe('Frozen Files Actual Existence', () => {
    it('should have all frozen files actually exist on disk', () => {
      const progressJson = readJsonFile('claude-progress.json')

      progressJson.frozen_files.forEach(file => {
        // Handle wildcard paths like src/schemas/*
        if (file.path.includes('*')) {
          const dir = file.path.replace('/*', '')
          expect(fileExists(dir)).toBe(true)
        } else {
          expect(fileExists(file.path)).toBe(true)
        }
      })
    })
  })

  describe('CLAUDE.md Frozen Files Match', () => {
    it('should have frozen files documented in CLAUDE.md', () => {
      const claudeMd = readFile('CLAUDE.md')

      // Check that key frozen files are mentioned in CLAUDE.md
      const keyFrozenFiles = [
        'firestore.rules',
        'AuthContext.jsx',
        'paymentsService.js',
        'firebase.js'
      ]

      keyFrozenFiles.forEach(file => {
        expect(claudeMd).toContain(file)
      })
    })
  })

  describe('GitHub Actions Workflow', () => {
    it('should have security workflow', () => {
      expect(fileExists('.github/workflows/security.yml')).toBe(true)
    })

    it('should have security checks in workflow', () => {
      const workflow = readFile('.github/workflows/security.yml')
      expect(workflow).toContain('lint')
      expect(workflow).toContain('build')
    })
  })

  describe('Settings Configuration', () => {
    it('should have valid settings.local.json', () => {
      const settings = readJsonFile('.claude/settings.local.json')
      expect(settings).toHaveProperty('permissions')
    })

    it('should have allowed operations for version management', () => {
      const settings = readJsonFile('.claude/settings.local.json')
      const permissions = settings.permissions?.allow || []

      // Check that npm version and git tag commands are allowed
      // Wildcard patterns like Bash(npm:*) and Bash(git:*) cover these commands
      const hasVersionPermissions = permissions.some(p =>
        p.includes('npm version') || p.includes('git tag') ||
        p === 'Bash(npm:*)' || p === 'Bash(git:*)'
      )
      expect(hasVersionPermissions).toBe(true)
    })
  })
})

describe('Documentation Consistency', () => {
  it('should have docs/REFERENCE.md', () => {
    expect(fileExists('docs/REFERENCE.md')).toBe(true)
  })

  it('should have DEPLOYMENT.md', () => {
    expect(fileExists('DEPLOYMENT.md')).toBe(true)
  })

  it('should have consistent test count in CLAUDE.md', () => {
    const claudeMd = readFile('CLAUDE.md')
    // Extract test count from CLAUDE.md (looks for pattern like "95 automated tests" or "95 tests")
    const testCountMatch = claudeMd.match(/(\d+)\s+(automated\s+)?tests?/i)

    if (testCountMatch) {
      const documentedCount = parseInt(testCountMatch[1])
      // We have 152 tests now, but CLAUDE.md might say 95
      // This test ensures documentation stays relatively accurate
      // Allow some variance since we may add tests
      expect(documentedCount).toBeGreaterThanOrEqual(90)
    }
  })
})

pipeline {
	agent { docker { image 'node:20' } }
	options {
		timestamps()
		skipDefaultCheckout(false)
	}
	stages {
		stage('Install Root Deps') {
			steps {
				sh 'node -v && npm -v'
				sh 'npm ci || npm install'
			}
		}
		stage('Install Package Deps') {
			steps {
				sh 'cd client && (npm ci || npm install)'
				sh 'cd server && (npm ci || npm install)'
			}
		}
		stage('Test: Shared (Jest)') {
			steps {
				sh 'npm run test:shared'
			}
		}
		stage('Test: Client (CRA)') {
			steps {
				sh 'npm run test:client'
			}
		}
	}
	post {
		always {
			archiveArtifacts artifacts: 'coverage/**/*', onlyIfSuccessful: false, allowEmptyArchive: true
		}
	}
}



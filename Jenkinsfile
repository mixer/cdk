properties([[$class: 'BuildDiscarderProperty', strategy: [$class: 'LogRotator']]])

node {
    nvm("version":"v8") {
      try {
          stage("Checkout") {
              checkout scm
          }
          stage("Install") {
              sh 'rm -rf node_modules'
              sh 'npm install --no-package-lock'
              sh 'npm ls --depth=0'
          }
          stage("Test") {
              sh 'npm run test:ci'
          }
          currentBuild.result = "SUCCESS"
      } catch(e) {
          currentBuild.result = "FAILURE"
          throw e
      }
    }
}

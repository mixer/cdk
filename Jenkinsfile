properties([[$class: 'BuildDiscarderProperty', strategy: [$class: 'LogRotator']]])

node {
    try {
        stage("Checkout") {
            checkout scm
        }
        stage("Install") {
            sh 'npm install'
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

library 'shared-library@4.28.0'

properties([
    buildDiscarder(
        logRotator(
            daysToKeepStr: '30', // how many days to keep history
            numToKeepStr: '200', // number of build logs to keep
            artifactDaysToKeepStr: '30', // how many days to keep artifacts
            artifactNumToKeepStr: '200', // number of builds with artifacts kept
        )
    )
])

def slackChannel = '#konfigure-dev'
def branchesToPublish = ['main']

withPipeline(
    nodeLabel: 'dataeng',
    slackChannelMap: ['main': slackChannel])
{
    String currentBranch
    Boolean isPr

    stage('Init') {
        checkout scm

        isPr = env.CHANGE_ID != null
        currentBranch = isPr
            ? env.CHANGE_BRANCH
            : env.BRANCH_NAME

        //if this is PR build, latest commit is target merge, so need penultimate
        commitMessage = sh(
            script: "git log -n 1 ${isPr ? '' : '--skip 1'} --pretty=%B",
            returnStdout: true).trim()

        println "Branch: $currentBranch"
        println "Commit message: $commitMessage"

        if (commitMessage.contains('[publish]')) {
            branchesToPublish += currentBranch
        }
    }

    withNodejs {
    runLocalDocker(
        imageName: 'node-build',
        version: 'c4cb1e5b92b0d2ea4de4d0ca266913c96c1d20b7',
        repo: 'dataeng-tools',
        dockerfile: 'node.Dockerfile'
    ) {

    stage('Build') {
        sh 'npm install'
        sh 'npm run build'
    }

    stage('Test') {
        sh 'npm run test'
    }

    stage('Lint') {
        sh 'npm run precommit'
    }
    }

    if (currentBranch in branchesToPublish) {
    stage('Release') {
        semanticRelease slackChannel
    } }
    }
}

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
    stage('Build') {
        runLocalDocker(
            imageName: 'node-build',
            version: 'v6.2.0',
            repo: 'dataeng-tools',
            dockerfile: 'node.Dockerfile'
        ) {
            sh 'npm install'
            sh 'npm run build'
        }
    }

    if (currentBranch in branchesToPublish) {
    stage('Release') {
        semanticRelease slackChannel
    } }
    }
}

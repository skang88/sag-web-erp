pipeline {
    agent any
    tools {
        nodejs 'NodeJs' // Jenkins에 설치된 Node.js 버전 사용
    }
    environment {
        BACKEND_IMAGE = 'sag-web-erp-backend'
        FRONTEND_IMAGE = 'sag-web-erp-front'
        RELAY_IMAGE = 'sag-web-erp-relay'
        BACKEND_CONTAINER = 'sag-web-erp-backend'
        FRONTEND_CONTAINER = 'sag-web-erp-front'
        RELAY_CONTAINER = 'sag-web-erp-relay'
        BACKEND_PORT = '8001:3000' 
        RTSP_PORT = '8082:8082' // RTSP 스트림 포트 설정 
        FRONTEND_PORT = '8000:3000'
        RELAY_PORT = '8082:8082'
    }
    stages {
        stage('Notify Build Start') { // 빌드 시작 알림
            when {
                not { triggeredBy 'hudson.triggers.TimerTrigger$TimerTriggerCause' }
            }
            steps {
                script {
                    sendTeamsNotification("빌드를 시작합니다.", "0078D7") // Blue
                }
            }
        }

        stage('Checkout') { // 코드 체크아웃 단계
            steps {
                git branch: 'main', url: 'https://github.com/skang88/sag-web-erp.git'
            }
        }

        stage('Run Maintenance Tasks') {
            when {
                triggeredBy 'hudson.triggers.TimerTrigger$TimerTriggerCause'
            }
            steps {
                script {
                    try {
                        echo "Executing daily maintenance script: update-visitor-status.js"
                        sh "docker start ${BACKEND_CONTAINER} || true"
                        sh "docker exec ${BACKEND_CONTAINER} node /usr/src/app/scripts/update-visitor-status.js"
                        sendTeamsNotification("일일 방문객 상태 업데이트 스크립트가 성공적으로 실행되었습니다.", "28A745") // Green
                    } catch (e) {
                        echo "Failed to execute maintenance script: ${e.message}"
                        sendTeamsNotification("일일 방문객 상태 업데이트 스크립트 실행에 실패했습니다.", "DC3545") // Red
                        error "Maintenance script failed"
                    }
                }
            }
        }

        stage('Prepare Environment') { // 디버깅을 위한 기본 환경 확인
            when {
                not { triggeredBy 'hudson.triggers.TimerTrigger$TimerTriggerCause' }
            }
            steps {
                sh 'pwd'
                sh 'ls -al'
                sh 'docker ps -a'
            }
        }

        stage('Build & Deploy') { // 백엔드와 프론트엔드를 병렬로 빌드 및 배포
            when {
                not { triggeredBy 'hudson.triggers.TimerTrigger$TimerTriggerCause' }
            }
            parallel {
                stage('Back-end') {
                    stages {
                        stage('Build Back-end Image') { // 백엔드 도커 이미지 빌드
                            steps {
                                dir('server') {
                                    sh "docker build -t ${BACKEND_IMAGE} ."
                                }
                            }
                        }

                        stage('Clean Up Old Back-end Container') { // 기존 백엔드 컨테이너 정리
                            steps {
                                script {
                                    dockerStopRemove(BACKEND_CONTAINER)
                                }
                            }
                        }

                        stage('Run Back-end Container') { // 새 백엔드 컨테이너 실행
                            steps {
                                withCredentials([file(credentialsId: 'backend-env-file', variable: 'BACKEND_ENV_FILE')]) {
                                    // -v 대신 --mount 옵션을 사용하여 파일임을 명시적으로 지정합니다.
                                    sh "docker run -d --name ${BACKEND_CONTAINER} -p ${BACKEND_PORT} -v c:/env/sag-web-erp/back-end/.env:/usr/src/app/.env --restart always ${BACKEND_IMAGE}"
                                    // sh "docker run -d --name ${BACKEND_CONTAINER} -p ${BACKEND_PORT} -p ${RTSP_PORT} --mount type=bind,source=${BACKEND_ENV_FILE},target=/usr/src/app/.env --restart always ${BACKEND_IMAGE}"
                                
                                }
                            }
                        }

                        stage('Verify Back-end Deployment') { // 백엔드 컨테이너 상태 확인
                            steps {
                                dockerInspect(BACKEND_CONTAINER, '/usr/src/app/app.js')
                                echo '--- Verifying backend .env file content ---'
                                sh "docker exec ${BACKEND_CONTAINER} cat /usr/src/app/.env"
                            }
                        }
                    }
                }

                stage('Front-end') {
                    stages {
                        stage('Build Front-end Image') { // 프론트엔드 도커 이미지 빌드
                            steps {
                                dir('client') {
                                    sh "docker build -t ${FRONTEND_IMAGE} ."
                                }
                            }
                        }

                        stage('Clean Up Old Front-end Container') { // 기존 프론트엔드 컨테이너 정리
                            steps {
                                script {
                                    dockerStopRemove(FRONTEND_CONTAINER)
                                }
                            }
                        }

                        stage('Run Front-end Container') { // 새 프론트엔드 컨테이너 실행
                            steps {
                                withCredentials([file(credentialsId: 'frontend-env-file', variable: 'FRONTEND_ENV_FILE')]) {
                                    // -v 대신 --mount 옵션을 사용하여 파일임을 명시적으로 지정합니다.
                                    sh "docker run -d --name ${FRONTEND_CONTAINER} -p ${FRONTEND_PORT} -v c:/env/sag-web-erp/front-end/.env:/usr/src/app/.env --restart always ${FRONTEND_IMAGE}"
                                }
                            }
                        }

                        stage('Verify Front-end Deployment') { // 프론트엔드 컨테이너 상태 확인
                            steps {
                                dockerInspect(FRONTEND_CONTAINER, '/usr/src/app/src/App.js')
                                echo '--- Verifying frontend .env file content ---'
                                sh "docker exec ${FRONTEND_CONTAINER} cat /usr/src/app/.env"
                            }
                        }
                    }
                }
                stage('Relay') {
                    stages {
                        stage('Build Relay Image') { // 릴레이 도커 이미지 빌드
                            steps {
                                dir('relay') {
                                    sh "docker build -t ${RELAY_IMAGE} ."
                                }
                            }
                        }

                        stage('Clean Up Old Relay Container') { // 기존 릴레이 컨테이너 정리
                            steps {
                                script {
                                    dockerStopRemove(RELAY_CONTAINER)
                                }
                            }
                        }

                        stage('Run Relay Container') { // 새 릴레이 컨테이너 실행
                            steps {
                                sh "docker run -d --name ${RELAY_CONTAINER} -p ${RELAY_PORT} --restart always ${RELAY_IMAGE}"
                            }
                        }

                        stage('Verify Relay Deployment') { // 릴레이 컨테이너 상태 확인
                            steps {
                                dockerInspect(RELAY_CONTAINER, '/usr/src/app/relay.js')
                            }
                        }
                    }
                }
            }
        }
    }
    post {
        success {
            script {
                if (!currentBuild.getBuildCauses().toString().contains('TimerTrigger')) {
                    sendTeamsNotification("빌드가 성공적으로 완료되었습니다.", "28A745") // Green
                }
            }
        }
        failure {
            script {
                if (!currentBuild.getBuildCauses().toString().contains('TimerTrigger')) {
                    sendTeamsNotification("빌드에 실패했습니다.", "DC3545") // Red
                }
            }
        }
        always {
            cleanWs() // 작업 공간 정리
        }
    }
}

def dockerStopRemove(containerName) {
    sh "docker stop ${containerName} || true"
    sh "docker rm ${containerName} || true"
}

def dockerInspect(containerName, filePath) {
    sh 'docker ps -a' // 현재 실행 중인 모든 도커 컨테이너 확인
    sh "docker exec ${containerName} ls -al /usr/src/app" // 내부 파일 목록 확인
    sh "docker exec ${containerName} cat ${filePath}" // 주요 파일 내용 출력
}

def sendTeamsNotification(message, color) {
    def status = currentBuild.currentResult ?: 'In Progress'
    def payload = """
    {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": "${color}",
        "summary": "Jenkins Build: ${env.JOB_NAME} - ${status}",
        "sections": [{
            "activityTitle": "${message}",
            "facts": [
                { "name": "Project", "value": "${env.JOB_NAME}" },
                { "name": "Build", "value": "<a href='${env.BUILD_URL}'>#${env.BUILD_NUMBER}</a>" },
                { "name": "Status", "value": "${status}" }
            ],
            "markdown": true
        }]
    }
    """.trim()
    // withCredentials 블록을 사용하여 Jenkins에 저장된 Secret text를 안전하게 불러옵니다. << New
    withCredentials([string(credentialsId: 'teams-webhook-url', variable: 'TEAMS_WEBHOOK_URL')]) {
        sh(script: "curl -H 'Content-Type: application/json' -d '${payload.trim()}' \"${TEAMS_WEBHOOK_URL}\"")
    }
}
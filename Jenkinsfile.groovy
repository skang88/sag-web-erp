pipeline {
    agent any
    tools {
        nodejs 'NodeJs' // Jenkins에 설치된 Node.js 버전 사용
    }
    environment {
        BACKEND_IMAGE = 'sag-web-erp-backend'
        FRONTEND_IMAGE = 'sag-web-erp-front'
        BACKEND_CONTAINER = 'sag-web-erp-backend'
        FRONTEND_CONTAINER = 'sag-web-erp-front'
        BACKEND_PORT = '8001:3000' 
        RTSP_PORT = '9999:9999' // RTSP 스트림 포트 설정 
        FRONTEND_PORT = '8000:3000'
    }
    stages {
        stage('Notify Build Start') { // 빌드 시작 알림
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

        stage('Prepare Environment') { // 디버깅을 위한 기본 환경 확인
            steps {
                sh 'pwd'
                sh 'ls -al'
                sh 'docker ps -a'
            }
        }

        stage('Build & Deploy') { // 백엔드와 프론트엔드를 병렬로 빌드 및 배포
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
                                    // --env-file 대신 -v 옵션을 사용하여 파일을 직접 마운트합니다.
                                    sh "docker run -d --name ${BACKEND_CONTAINER} -p ${BACKEND_PORT} -p ${RTSP_PORT} -v ${BACKEND_ENV_FILE}:/usr/src/app/.env --restart always ${BACKEND_IMAGE}"
                                }
                            }
                        }

                        stage('Verify Back-end Deployment') { // 백엔드 컨테이너 상태 확인
                            steps {
                                dockerInspect(BACKEND_CONTAINER, '/usr/src/app/app.js')
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
                                    // --env-file 대신 -v 옵션을 사용하여 파일을 직접 마운트합니다.
                                    sh "docker run -d --name ${FRONTEND_CONTAINER} -p ${FRONTEND_PORT} -v ${FRONTEND_ENV_FILE}:/usr/src/app/.env --restart always ${FRONTEND_IMAGE}"
                                }
                            }
                        }

                        stage('Verify Front-end Deployment') { // 프론트엔드 컨테이너 상태 확인
                            steps {
                                dockerInspect(FRONTEND_CONTAINER, '/usr/src/app/src/App.js')
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
                sendTeamsNotification("빌드가 성공적으로 완료되었습니다.", "28A745") // Green
            }
        }
        failure {
            script {
                sendTeamsNotification("빌드에 실패했습니다.", "DC3545") // Red
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
    """
    // withCredentials 블록을 사용하여 Jenkins에 저장된 Secret text를 안전하게 불러옵니다.
    withCredentials([string(credentialsId: 'teams-webhook-url', variable: 'TEAMS_WEBHOOK_URL')]) {
        sh(script: "curl -H 'Content-Type: application/json' -d '${payload.trim()}' \"${TEAMS_WEBHOOK_URL}\"")
    }
}

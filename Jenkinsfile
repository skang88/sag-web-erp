pipeline {
    agent any
    tools {
        nodejs 'NodeJs'
    }
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/skang88/sag-web-erp.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('server') {
                    sh 'npm install'
                }
            }
        }

        stage('Build') { 
            steps {
                dir('server') {
                    sh 'docker build -t sag-web-erp .'
                }
            }
        }
        stage('Stop & Remove Old Container') {
            steps {
                // 기존 컨테이너 중지 및 제거 (컨테이너 이름은 'node-app'로 가정)
                sh 'docker stop sag-web-erp || true'
                sh 'docker rm sag-web-erp || true'
            }
        }
        stage('Run New Container') {
            steps {
                // 새로 빌드한 이미지를 사용하여 새로운 컨테이너 실행
                sh 'docker run -d --name sag-web-erp -p 8081:3000 sag-web-erp'
            }
        }
    }
}
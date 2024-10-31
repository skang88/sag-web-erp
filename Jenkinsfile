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

        stage('No Install Dependencies') {
            steps {
                sh 'pwd'
                sh 'dir'
                sh 'ls server'
                sh 'docker ps -a'
            }
        }

        stage('Build Back-end') { 
            steps {
                dir('server') {
                    sh 'docker build -t sag-web-erp .'
                }
            }
        }

        stage('Stop & Remove Old Container Back-end') {
            steps {
                // 기존 컨테이너 중지 및 제거 (컨테이너 이름은 'node-app'로 가정)
                sh 'docker stop sag-web-erp || true'
                sh 'docker rm sag-web-erp || true'
            }
        }

        stage('Run New Back-end Container') {
            steps {
                // 새로 빌드한 이미지를 사용하여 새로운 컨테이너 실행
                sh 'docker run -d --name sag-web-erp -p 8081:3000 -v c:/env/sag-web-erp/back-end/.env:/usr/src/app/.env sag-web-erp'
            }
        }

        stage('Check Running Containers') {
            steps {
                // Docker 실행 결과 및 도커 내부 디렉터리 파일 보기
                sh 'docker ps -a'
                sh 'docker exec sag-web-erp ls -al /usr/src/app'
                sh 'docker exec sag-web-erp cat /usr/src/app/app.js'
                
            }
        }

        stage('Build Front-end') { 
            steps {
                echo 'Hello world!'
                echo 'Im going to built front-end'
                dir('client') {
                    sh 'docker build -t sag-web-erp-front .'
                }
            }
        }

        stage('Stop & Remove Old Container Front-end') {
            steps {
                // 기존 컨테이너 중지 및 제거 (컨테이너 이름은 'node-app'로 가정)
                sh 'docker stop sag-web-erp-front || true'
                sh 'docker rm sag-web-erp-front || true'
            }
        }
        
        stage('Run New Front-end Container') {
            steps {
                // 새로 빌드한 이미지를 사용하여 새로운 컨테이너 실행
                sh 'docker run -d --name sag-web-erp-front -p 8082:3000 -v c:/env/sag-web-erp/front-end/.env:/usr/src/app/.env sag-web-erp-front'
            }
        }

        stage('Check Running Containers front') {
            steps {
                // Docker 실행 결과 및 도커 내부 디렉터리 파일 보기
                sh 'docker ps -a'
                sh 'docker exec sag-web-erp-front ls -al /usr/src/app'
                sh 'docker exec sag-web-erp-front cat /usr/src/app/app.js'
                
            }
        }
        
    }
}
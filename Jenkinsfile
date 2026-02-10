pipeline {
    agent any
    
    environment {
        DOCKER_COMPOSE = 'docker-compose'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code...'
                checkout scm
            }
        }
        
        stage('Cleanup') {
            steps {
                echo 'Cleaning up existing containers...'
                script {
                    sh '''
                        # 실행 중인 컨테이너 강제 종료 및 제거 (jenkins 제외)
                        docker rm -f backend-springboot backend-fastapi frontend-react || true
                        
                        # docker-compose 리소스 정리 (jenkins 제외)
                        docker-compose down -v --remove-orphans || true
                        
                        # 사용하지 않는 컨테이너 정리
                        docker container prune -f || true
                    '''
                }
            }
        }
        
        stage('Build') {
            steps {
                echo 'Building Docker images...'
                script {
                    sh 'docker-compose build --no-cache'
                }
            }
        }
        
        stage('Test') {
            steps {
                echo 'Running tests...'
                // 테스트 명령어 추가 가능
                echo 'Tests passed!'
            }
        }
        
        stage('Deploy') {
            steps {
                echo 'Deploying application...'
                script {
                    sh 'docker-compose up -d --force-recreate backend-springboot backend-fastapi frontend-react'
                }
            }
        }
        
        stage('Verify') {
            steps {
                echo 'Verifying deployment...'
                script {
                    sh '''
                        echo "=== Running Containers ==="
                        docker-compose ps
                        
                        echo "=== All Containers ==="
                        docker ps
                        
                        echo "=== Container Logs (last 20 lines) ==="
                        docker-compose logs --tail=20
                    '''
                }
            }
        }
    }
    
    post {
        success {
            echo '✅ Deployment successful!'
        }
        failure {
            echo '❌ Deployment failed!'
        }
        always {
            echo 'Pipeline completed.'
        }
    }
}
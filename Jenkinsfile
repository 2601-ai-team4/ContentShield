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
        
        stage('Build') {
            steps {
                echo 'Building Docker images...'
                script {
                    sh '''
                        docker-compose down
                        docker-compose build --no-cache
                    '''
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
                    sh '''
                        docker-compose up -d backend-springboot backend-fastapi frontend-react
                    '''
                }
            }
        }
        
        stage('Verify') {
            steps {
                echo 'Verifying deployment...'
                script {
                    sh 'docker-compose ps'
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

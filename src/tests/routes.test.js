import request from 'supertest';
import app from '../server.js';
import jwt from 'jsonwebtoken';

// Mock token valide pour les tests
const validToken = jwt.sign(
  { id: 1, username: 'test@example.com', role: 'user' },
  process.env.JWT_SECRET || '123456',
  { expiresIn: '1h' }
);

describe('API Gateway Tests', () => {
  let authToken;

  // Test de la route health
  describe('Health Check', () => {
    it('should return 200 OK', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  // Tests du service d'authentification
  describe('Auth Service', () => {
    beforeAll(() => {
      // Définir le token valide pour les tests
      authToken = validToken;
    });

    it('should login successfully', async () => {
      // Mock la réponse du service d'authentification
      const response = await request(app)
        .post('/ms-auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      // En test, on accepte soit 200 soit 502 (service non disponible)
      expect([200, 502]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('token');
      }
    });

    it('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/ms-auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'wrongpass'
        });
      
      // Accepter soit 401 (échec auth) soit 502 (service non disponible)
      expect([401, 502]).toContain(response.status);
    });
  });

  // Tests du service de livres
  describe('Book Service', () => {
    it('should get books without authentication', async () => {
      const response = await request(app)
        .get('/ms-book/books');
      
      // En test, on accepte soit 200 soit 502 (service non disponible)
      expect([200, 502]).toContain(response.status);
    });

    it('should create book with valid token', async () => {
      const response = await request(app)
        .post('/ms-book/books')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          title: 'Test Book',
          author: 'Test Author',
          categories: ['Test'],
          description: 'Test Description'
        });

      // En test, on accepte soit 201 soit 502 (service non disponible)
      expect([201, 502]).toContain(response.status);
    });

    it('should fail to create book without token', async () => {
      const response = await request(app)
        .post('/ms-book/books')
        .send({
          title: 'Test Book',
          author: 'Test Author'
        });

      expect(response.status).toBe(401);
    });
  });

  // Tests du service de notifications
  describe('Notification Service', () => {
    it('should require authentication for notifications', async () => {
      const response = await request(app)
        .get('/ms-notification/notifications');
      
      expect(response.status).toBe(401);
    });

    it('should get notifications with valid token', async () => {
      const response = await request(app)
        .get('/ms-notification/notifications')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Accepter soit 200 (succès) soit 502 (service non disponible)
      expect([200, 502]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBeTruthy();
      }
    });
  });

  // Tests des erreurs
  describe('Error Handling', () => {
    it('should return 404 for unknown route', async () => {
      const response = await request(app)
        .get('/unknown-route');
      
      expect(response.status).toBe(404);
    });

    it('should handle invalid token format', async () => {
      const response = await request(app)
        .post('/ms-book/books')
        .set('Authorization', 'InvalidFormat');
      
      expect(response.status).toBe(401);
      // Vérifier que l'erreur contient l'un des messages attendus
      expect(['Token error', 'Token malformatted']).toContain(response.body.error);
    });

    it('should handle expired token', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJ0ZXN0IiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.GL5jAv7Rul-KZh9Van7HnXGyZOkT0B9q3xF7mjUMyP8';
      
      const response = await request(app)
        .post('/ms-book/books')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send({
          title: 'Test Book',
          author: 'Test Author'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Token invalid');
    });
  });
});
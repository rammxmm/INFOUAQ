import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create the dashboard component', () => {
    expect(component).toBeTruthy();
  });

  it('should default to Inicio view', () => {
    expect(component.activeView).toBe('Inicio');
  });

  it('should filter subjects by search term', () => {
    component.subjectSearch = 'Web';
    expect(component.filteredSubjects.length).toBeGreaterThanOrEqual(1);
    expect(component.filteredSubjects[0].name).toContain('Web');
  });

  it('should open and close upload modal', () => {
    component.openUploadModal();
    expect(component.isUploadModalOpen).toBe(true);
    component.closeUploadModal();
    expect(component.isUploadModalOpen).toBe(false);
  });

  it('should switch roles and update user profile', () => {
    component.switchRole('Profesor');
    expect(component.currentRole).toBe('Profesor');
    expect(component.currentUser.role).toBe('Profesor');

    component.switchRole('Administrador');
    expect(component.currentRole).toBe('Administrador');

    component.switchRole('Estudiante');
    expect(component.currentRole).toBe('Estudiante');
  });

  it('should open document detail with integrated comments', () => {
    const testDoc = component.documents[0];
    component.openDocumentDetail(testDoc);
    expect(component.activeView).toBe('Detalle Documento');
    expect(component.selectedDocument).toBe(testDoc);
  });

  it('should add a comment and toggle like on a document', () => {
    const testDoc = component.documents[0];
    component.openDocumentDetail(testDoc);
    const initialCount = testDoc.comments.length;

    component.newCommentText = 'Duda sobre la práctica 2';
    component.submitNewComment();

    expect(testDoc.comments.length).toBe(initialCount + 1);
    expect(testDoc.comments[0].content).toBe('Duda sobre la práctica 2');

    const comment = testDoc.comments[0];
    const initialLikes = comment.likes;
    component.toggleLike(comment);
    expect(comment.likes).toBe(initialLikes + 1);
    expect(comment.userLiked).toBe(true);
  });
});

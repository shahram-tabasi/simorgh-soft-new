import React, { useState, useEffect } from 'react';
import { ProjectData } from '../../types/project';
import { projectService } from '../../services/projectService';
import simorghLogo from '../../assets/simrgh.jpg';

interface ProjectSelectionProps {
  onProjectSelect: (project: ProjectData) => void;
  onNewProject: () => void;
}

export const ProjectSelection: React.FC<ProjectSelectionProps> = ({
  onProjectSelect,
  onNewProject,
}) => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectsData = await projectService.getAllProjects();
      setProjects(projectsData);
    } catch (err) {
      setError('Failed to load projects');
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.projectDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProjectSelect = (project: ProjectData) => {
    onProjectSelect(project);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center py-4">
            <img
              src={simorghLogo}
              alt="Simorgh logo"
              className="max-h-12 w-auto mr-3 object-contain"
            />
            <h1 className="text-2xl font-bold text-blue-800">
              Simorgh Software - Project Selection
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          {/* Search and New Project */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search projects by name or description..."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={onNewProject}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 whitespace-nowrap"
              >
                Create New Project
              </button>
            </div>
          </div>

          {/* Projects List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Select Project</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {filteredProjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No projects found matching your search.' : 'No projects found.'}
                <br />
                <button
                  onClick={onNewProject}
                  className="text-blue-600 hover:text-blue-800 mt-2"
                >
                  Create a new project
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredProjects.map((project) => (
                  <div
                    key={project._id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleProjectSelect(project)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg text-blue-800">
                          {project.projectName}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">
                          {project.projectDescription}
                        </p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>Client: {project.client}</span>
                          <span>Location: {project.location}</span>
                          <span>Standard: {project.standard}</span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <div>Created: {project.createdOn}</div>
                        <div>Modified: {project.changedOn}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
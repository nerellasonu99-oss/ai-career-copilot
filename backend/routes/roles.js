const express = require('express');
const router = express.Router();

const roles = [
  {
    id: 'ai-ml-engineer',
    label: 'AI / ML Engineer',
    icon: '🤖',
    description: 'Build predictive systems and production AI systems.'
  },
  {
    id: 'generative-ai-engineer',
    label: 'Generative AI / AI Engineer',
    icon: '🧠',
    description: 'Build LLM tools, agents, and AI applications.'
  },
  {
    id: 'cloud-engineer',
    label: 'Cloud Engineer',
    icon: '☁️',
    description: 'Design secure, resilient cloud infrastructure.'
  },
  {
    id: 'devops-platform-engineer',
    label: 'DevOps / Platform Engineer',
    icon: '⚙️',
    description: 'Automate builds, deployments, and platform operations.'
  },
  {
    id: 'cybersecurity-engineer',
    label: 'Cybersecurity Engineer / Analyst',
    icon: '🔐',
    description: 'Protect systems, data, and application security.'
  },
  {
    id: 'data-engineer',
    label: 'Data Engineer',
    icon: '📦',
    description: 'Build pipelines and data systems for analytics.'
  },
  {
    id: 'backend-software-engineer',
    label: 'Backend Software Engineer',
    icon: '🧩',
    description: 'Build APIs, services, and reliable backend platforms.'
  },
  {
    id: 'fullstack-developer',
    label: 'Full-Stack Developer',
    icon: '🌐',
    description: 'Ship end-to-end product experiences across stack layers.'
  },
  {
    id: 'mlops-engineer',
    label: 'MLOps Engineer',
    icon: '🔧',
    description: 'Deploy and maintain ML models in production.'
  },
  {
    id: 'software-engineer-ai-skills',
    label: 'Software Engineer with AI Skills',
    icon: '🧑‍💻',
    description: 'Integrate AI features into normal software products.'
  },
  {
    id: 'data-analyst',
    label: 'Data Analyst',
    icon: '📈',
    description: 'Turn metrics into business-driven decisions.'
  },
  {
    id: 'security-analyst',
    label: 'Security Analyst',
    icon: '🛡️',
    description: 'Monitor, detect, and reduce technical security risk.'
  }
];

router.get('/', (req, res) => {
  res.json({ roles });
});

router.get('/:roleId', (req, res) => {
  const role = roles.find((item) => item.id === req.params.roleId);

  if (!role) {
    return res.status(404).json({ message: 'Role not found' });
  }

  res.json({ role });
});

module.exports = router;

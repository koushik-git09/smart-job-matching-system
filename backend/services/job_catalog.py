from __future__ import annotations

from models.job import Job, JobRequiredSkill


def default_jobs() -> list[Job]:
    # Mirrors the roles shown in the current frontend mock cards.
    return [
        Job(
            id="1",
            title="Data Scientist",
            company="Google",
            location="Remote",
            type="Full-time",
            experience_level="Mid",
            description="Build and deploy ML models to production; partner with product teams.",
            required_skills=[
                JobRequiredSkill(name="Python", priority="must-have", required_level="advanced"),
                JobRequiredSkill(name="Data Analysis", priority="must-have", required_level="advanced"),
                JobRequiredSkill(name="Machine Learning", priority="must-have", required_level="intermediate"),
                JobRequiredSkill(name="Pandas", priority="good-to-have", required_level="advanced"),
                JobRequiredSkill(name="Deep Learning", priority="must-have", required_level="intermediate", estimated_learning_time="3 months"),
                JobRequiredSkill(name="PyTorch", priority="must-have", required_level="intermediate", estimated_learning_time="2 months"),
            ],
        ),
        Job(
            id="2",
            title="Machine Learning Engineer",
            company="Amazon",
            location="Seattle",
            type="Full-time",
            experience_level="Mid",
            description="Own ML pipelines and deployment workflows; improve model reliability.",
            required_skills=[
                JobRequiredSkill(name="Python", priority="must-have", required_level="advanced"),
                JobRequiredSkill(name="Machine Learning", priority="must-have", required_level="intermediate"),
                JobRequiredSkill(name="TensorFlow", priority="good-to-have", required_level="intermediate"),
                JobRequiredSkill(name="MLOps", priority="must-have", required_level="intermediate", estimated_learning_time="3 months"),
                JobRequiredSkill(name="Docker", priority="must-have", required_level="intermediate", estimated_learning_time="1 month"),
                JobRequiredSkill(name="Kubernetes", priority="good-to-have", required_level="beginner", estimated_learning_time="2 months"),
            ],
        ),
        Job(
            id="3",
            title="Senior Data Analyst",
            company="Microsoft",
            location="Redmond",
            type="Full-time",
            experience_level="Senior",
            description="Drive dashboards and insights; influence product and GTM decisions.",
            required_skills=[
                JobRequiredSkill(name="Python", priority="must-have", required_level="advanced"),
                JobRequiredSkill(name="SQL", priority="must-have", required_level="intermediate"),
                JobRequiredSkill(name="Data Analysis", priority="must-have", required_level="advanced"),
                JobRequiredSkill(name="Pandas", priority="good-to-have", required_level="advanced"),
                JobRequiredSkill(name="Power BI", priority="good-to-have", required_level="intermediate", estimated_learning_time="1 month"),
            ],
        ),
        Job(
            id="4",
            title="AI Research Scientist",
            company="OpenAI",
            location="San Francisco",
            type="Full-time",
            experience_level="Senior",
            description="Conduct research and publish; build novel DL approaches.",
            required_skills=[
                JobRequiredSkill(name="Python", priority="must-have", required_level="advanced"),
                JobRequiredSkill(name="Machine Learning", priority="must-have", required_level="advanced"),
                JobRequiredSkill(name="Deep Learning", priority="must-have", required_level="advanced", estimated_learning_time="6 months"),
                JobRequiredSkill(name="PyTorch", priority="must-have", required_level="advanced", estimated_learning_time="4 months"),
                JobRequiredSkill(name="Research Publications", priority="must-have", required_level="advanced", estimated_learning_time="12 months"),
            ],
        ),
    ]

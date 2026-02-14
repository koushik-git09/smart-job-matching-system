from services.resume_parser import extract_text_from_pdf, extract_skills

file_path = "sample_resume.pdf"  # put a pdf in backend folder

text = extract_text_from_pdf(file_path)
skills = extract_skills(text)

print("Extracted Skills:")
print(skills)

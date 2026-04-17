import os
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from dotenv import load_dotenv

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

def create_memory():
    custom_text = """
1. Overview and Mission
The Club Génie Informatique (CGI), also referred to as the Computer Science Engineering Club (CSEC), is the flagship student organization for the computer science engineering branch at the École Nationale des Sciences Appliquées de Marrakech (ENSA Marrakech), which is part of the Université Cadi Ayyad (UCA).
The club is a dedicated space for technology enthusiasts, focusing on various digital domains such as programming, cybersecurity, and mobile application development. CGI operates on a "Learning by Doing" methodology, providing students with a hands-on learning environment through practical workshops, collaborative projects, and competitions. Its primary mission is to bridge the gap between academic theory and the professional world while fostering innovation, creativity, and knowledge exchange among students.

2. Organizational Structure and Cells
CGI is governed by an Executive Board (Bureau Exécutif) that oversees several specialized functional units or "cells" (cellules) to ensure the efficient operation of the club. These poles include:
Technical / Coding: Responsible for coordinating technical projects, preparing hackathons, and running coding bootcamps.
Multimedia & Design: Handles digital art, web design, video production, and graphic design for the club's social media presence.
Sponsorship & PR: Focuses on building relationships with corporate partners, securing funding, and marketing events.
Logistics & Events: Manages the physical and organizational requirements for summits, career expos, and technical workshops.
Training & Pedagogy: Manages the club’s educational resources, blogs, and learning roadmaps.

3. Executive Board (Bureau Exécutif)
The club is led by a dedicated team of students who manage its strategic direction and daily operations. The current executive board consists of:
Président: Mekrane Bahae Eddine (https://linkedin.com/in/bahae-eddine-mekrane-0938122b1)
Vice Président: Izelgue Malika (https://www.linkedin.com/in/malika-izelgue-3b8015319)
General Secretary: Tifawt Ziam (https://www.linkedin.com/in/tifawt-ziam-032034318)
Head Of Competition: Tabati Zakaria (https://www.linkedin.com/in/zakariatabati)
Head Of Training I: Berrada Sara (https://www.linkedin.com/in/sara-berrada-034686320)
Head Of Training II: Ait Lfakir Nassima (https://www.linkedin.com/in/nassima-ait-lfakir-4b2a45303)
Head Of Projects I: Izmaoun Amine (https://www.linkedin.com/in/amine-izmaoun-5ab61232a/)
Head Of Projects II: El Idrissi Abdellah (https://www.linkedin.com/in/abdellah-elidrissi)
Head Of Events: Darhmouaoui Aya
Head Of Design & Media: El Ahmadi Hiba (https://www.linkedin.com/in/hiba-el-ahmadi-908271370)
Head Of Sponsoring: Boulaarab Soufiane (https://www.linkedin.com/in/soufiane-boulaarab-853651356)

Note: Key staff and mentors include Abdelghani Bensalih, Mohamed Aymane Bouhmouch, Abla Sarir, Salma Maskahi, Zakaria Zoulati, and Kartik Agrawal.

4. Key Events and Initiatives
Gemini Hack Night (April 10–11): Overnight hackathon at Code212 UCA center. Teams of 4, AI-powered projects. Sponsors: Google Gemini, MLH, Devpost, Miro, Featherless AI.
Informatique Day: Conference connecting students and professionals, supported by Leyton.
Coding League: Biweekly competitive programming sessions launched in Nov 2025.
Compile & Conquer (February 14): CP competition with 10 teams tackling 15 algorithmic problems.

5. Strategic Partnerships and Ecosystem
Code212-UCA: Major institutional partner hosting Coding League and Hack Nights.
Leyton: Corporate sponsor for Informatique Day and Gemini Hack Night.
Partners: Google Gemini, MLH, Devpost, Miro, Featherless AI.

6. Digital Footprint
LinkedIn: Club Informatique ENSA Marrakech (CGI-ENSA DE MARRAKECH) - https://linkedin.com/company/club-informatique-ensa-marrakech
Instagram: @cgi.ensa_m - https://instagram.com/cgi.ensa_m/

7. Identity and Mission (Detailed)
The CGI is defined by its role as a bridge between academic theory and the practical demands of the global technology market. Its core philosophy is "Learning by Doing," encouraging students to take ownership of their technical growth.
Mission: To provide a collaborative environment where students can master emerging technologies, develop leadership skills, and engage in high-impact technical projects.
Target Audience: Primarily engineering students at ENSA Marrakech, though its events often reach the broader university community and national talent pools.
Cultural Values: Innovation, creativity, and professional rigor. The club emphasizes technical and managerial challenges, aiming to produce "operational" engineers ready for immediate industry integration.

8. Partnership Ecosystem (Detailed)
The CGI leverages a robust network of institutional and corporate partners to enhance the quality of its activities.
Code212 (Cadi Ayyad University): A strategic alliance established in 2025 to centralize technical excellence, providing the club with facilities, expert mentorship, and joint event opportunities.
Major League Hacking (MLH): Provides international community standards, resources, and platforms for the club’s hacking events.
Corporate Sponsors: Includes global and local tech leaders such as Google (Gemini), Miro, and Capgemini, which provide technical APIs, software tools, and recruitment opportunities.

9. Technical Training and Workshops
Git & GitHub Mastery: Practical sessions focused on version control and collaborative development, often held in partnership with Code212.
AI & Machine Learning: Specialized workshops covering the Gemini API, LLM inference (via Featherless.ai), and data visualization.
Career Development: Active participation in the Career Expo ENSA-M, providing CV workshops and alumni networking sessions for students.

10. Large-Scale Events
The CGI is known for its ability to host large-scale, high-intensity events that bring together students and industry experts.
Major Competitions:
- Gemini Hack Night: An overnight AI-focused hackathon organized in collaboration with Code212 and supported by Major League Hacking (MLH). Participants work from sunset to sunrise to build functional demos using Google Gemini tools and other AI infrastructure.
- Coding League: A programming competition launched in partnership with the Code212 center, designed to challenge students' algorithmic and problem-solving skills.
"""

    print("Preparing custom data...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    
    custom_doc = Document(page_content=custom_text, metadata={"source": "user_provided"})
    chunks = text_splitter.split_documents([custom_doc])

    print("Generating embeddings and building the FAISS database for CGI/InfoClub...")
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    
    vector_store = FAISS.from_documents(chunks, embeddings)
    
    output_path = "ensa_faiss_index"
    vector_store.save_local(output_path)
    print(f"SUCCESS! Database saved to /{output_path}")

if __name__ == "__main__":
    create_memory()

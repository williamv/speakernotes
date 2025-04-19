from pptx import Presentation
import os

def extract_speaker_notes(pptx_path, output_path):
    """
    Extract speaker notes from a PowerPoint file and save them as markdown.
    
    Args:
        pptx_path (str): Path to the PowerPoint file
        output_path (str): Path where the markdown file will be saved
    """
    # Load the presentation
    prs = Presentation(pptx_path)
    
    # Create markdown content
    markdown_content = []
    
    # Add title
    markdown_content.append("# Speaker Notes\n\n")
    
    # Process each slide
    for i, slide in enumerate(prs.slides, 1):
        # Add slide number as header
        markdown_content.append(f"## Slide {i}\n")
        
        # Get notes
        notes_slide = slide.notes_slide
        if notes_slide and notes_slide.notes_text_frame:
            notes = notes_slide.notes_text_frame.text.strip()
            if notes:
                # Add notes with proper markdown formatting
                markdown_content.append(f"{notes}\n\n")
            else:
                markdown_content.append("No notes for this slide.\n\n")
        else:
            markdown_content.append("No notes for this slide.\n\n")
    
    # Write to file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.writelines(markdown_content)

if __name__ == "__main__":
    # Get the current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Define input and output paths
    pptx_file = os.path.join(current_dir, "Tabling Training 2025.pptx")
    output_file = os.path.join(current_dir, "speaker_notes.md")
    
    # Extract notes
    extract_speaker_notes(pptx_file, output_file)
    print(f"Speaker notes have been extracted and saved to {output_file}") 
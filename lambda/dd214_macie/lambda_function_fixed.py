# Copy the original file and add this fix at line 295
# This is just the fixed section - insert after line 294

        # If extracted text not provided, try to get it from DynamoDB first
        if not extracted_text or extracted_text == "{}":
            # Try to get from DynamoDB first (saved by ProcessTextractResults)
            db_extracted_text = item.get('extracted_text', '')
            if db_extracted_text:
                extracted_text = db_extracted_text
                print(f"Retrieved extracted text from DynamoDB: {len(extracted_text)} characters")
            else:
                try:
                    # First try full text file if it exists
                    full_text_key = f"textract-results/{document_id}/full_text.txt"
                    try:
                        response = s3_client.get_object(Bucket=bucket, Key=full_text_key)
                        extracted_text = response['Body'].read().decode('utf-8')
                        print(f"Retrieved full text from S3: {len(extracted_text)} characters")
                    except:
                        # Try to get the extraction summary from S3
                        summary_key = f"textract-results/{document_id}/extraction_summary.json"
                        summary_response = s3_client.get_object(Bucket=bucket, Key=summary_key)
                        summary_data = json.loads(summary_response['Body'].read())
                        extracted_text = summary_data.get('rawTextPreview', '')
                        
                        # Also try to get full text from the full results
                        if not extracted_text or extracted_text.endswith('...'):
                            full_results_key = f"textract-results/{document_id}/full_results.json"
                            try:
                                full_response = s3_client.get_object(Bucket=bucket, Key=full_results_key)
                                full_data = json.loads(full_response['Body'].read())
                                blocks = full_data.get('blocks', [])
                                # Extract text from blocks
                                lines = []
                                for block in blocks:
                                    if block.get('BlockType') == 'LINE':
                                        lines.append(block.get('Text', ''))
                                extracted_text = '\n'.join(lines)
                            except:
                                pass
                except Exception as e:
                    print(f"Could not retrieve extracted text from S3: {e}")
                    extracted_text = "Unable to retrieve document text for redaction"
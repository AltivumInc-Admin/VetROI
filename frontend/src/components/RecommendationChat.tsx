import { Career, RecommendationResponse } from '../types'

interface RecommendationChatProps {
  recommendations: RecommendationResponse
  onNewRequest: () => void
}

export default function RecommendationChat({ recommendations, onNewRequest }: RecommendationChatProps) {
  return (
    <div className="recommendation-chat">
      <div className="chat-header">
        <h2>Your Career Recommendations</h2>
        <button onClick={onNewRequest} className="new-request-button">
          Start New Request
        </button>
      </div>
      
      <div className="chat-messages">
        <div className="message bot-message">
          <p>
            Based on your military experience and preferences, I've identified these 
            five civilian career paths that would be an excellent match for you:
          </p>
        </div>
        
        {recommendations.recommendations.map((career: Career, index: number) => (
          <div key={career.soc} className="career-card">
            <div className="career-header">
              <h3>{index + 1}. {career.title}</h3>
              <span className="soc-code">SOC: {career.soc}</span>
            </div>
            
            <p className="career-summary">{career.summary}</p>
            
            <div className="career-details">
              <div className="salary">
                <strong>Expected Salary:</strong> ${career.medianSalary.toLocaleString()}
              </div>
              
              <div className="match-reason">
                <strong>Why This Matches:</strong> {career.matchReason}
              </div>
              
              <div className="next-step">
                <strong>Next Step:</strong> {career.nextStep}
              </div>
            </div>
          </div>
        ))}
        
        <div className="message bot-message">
          <p>
            Would you like to explore any of these careers in more detail? 
            You can also upload your DD-214 for more personalized recommendations.
          </p>
        </div>
      </div>
      
      <div className="session-info">
        <small>Session ID: {recommendations.sessionId}</small>
      </div>
    </div>
  )
}
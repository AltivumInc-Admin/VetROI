import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CareerPlanner from '../CareerPlanner'

// Mock ReactFlow with minimal implementation
vi.mock('@xyflow/react', () => ({
  ReactFlow: ({ children }: any) => <div data-testid="react-flow">{children}</div>,
  MiniMap: () => <div data-testid="mini-map" />,
  Controls: () => <div data-testid="controls" />,
  Background: () => <div data-testid="background" />,
  BackgroundVariant: { Dots: 'dots' },
  useNodesState: () => [[], vi.fn(), vi.fn()],
  useEdgesState: () => [[], vi.fn(), vi.fn()],
  addEdge: vi.fn(),
  Handle: () => null,
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' }
}))

// Mock node components
vi.mock('../nodes/TooltipNode', () => ({
  default: () => <div>TooltipNode</div>
}))

vi.mock('../nodes/PlaceholderNode', () => ({
  default: () => <div>PlaceholderNode</div>
}))

vi.mock('../nodes/DatabaseSchemaNode', () => ({
  default: () => <div>DatabaseSchemaNode</div>
}))

vi.mock('../nodes/AnnotationNode', () => ({
  default: () => <div>AnnotationNode</div>
}))

vi.mock('../nodes/LabeledGroupNode', () => ({
  default: () => <div>LabeledGroupNode</div>
}))

describe('CareerPlanner Basic Functionality', () => {
  it('renders the main components', () => {
    render(<CareerPlanner />)
    
    expect(screen.getByTestId('react-flow')).toBeInTheDocument()
    expect(screen.getByTestId('controls')).toBeInTheDocument()
    expect(screen.getByTestId('mini-map')).toBeInTheDocument()
    expect(screen.getByTestId('background')).toBeInTheDocument()
  })

  it('shows the node creation button', () => {
    render(<CareerPlanner />)
    
    const nodeButton = screen.getByText('Node')
    const plusIcon = screen.getByText('+')
    
    expect(nodeButton).toBeInTheDocument()
    expect(plusIcon).toBeInTheDocument()
  })

  it('toggles node menu on button click', async () => {
    const user = userEvent.setup()
    render(<CareerPlanner />)
    
    // Menu should not be visible initially
    expect(screen.queryByText('Tooltip')).not.toBeInTheDocument()
    
    // Click the node button
    const nodeButton = screen.getByText('Node').parentElement!
    await user.click(nodeButton)
    
    // Menu should now be visible with all options
    expect(screen.getByText('Tooltip')).toBeInTheDocument()
    expect(screen.getByText('Placeholder')).toBeInTheDocument()
    expect(screen.getByText('Database Schema')).toBeInTheDocument()
    expect(screen.getByText('Annotation')).toBeInTheDocument()
    expect(screen.getByText('Group with Label')).toBeInTheDocument()
  })

  it('has correct CSS structure', () => {
    render(<CareerPlanner />)
    
    const creationUI = document.querySelector('.node-creation-ui')
    expect(creationUI).toBeInTheDocument()
    
    const nodeButton = document.querySelector('.node-button')
    expect(nodeButton).toBeInTheDocument()
  })

  it('handles keyboard events without errors', () => {
    render(<CareerPlanner />)
    
    // Simulate Delete key
    const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' })
    document.dispatchEvent(deleteEvent)
    
    // Component should still be rendered
    expect(screen.getByTestId('react-flow')).toBeInTheDocument()
  })

  it('cleans up intervals on unmount', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
    
    const { unmount } = render(<CareerPlanner />)
    unmount()
    
    // Should have cleared the interval for window.careerToAdd checking
    expect(clearIntervalSpy).toHaveBeenCalled()
  })
})
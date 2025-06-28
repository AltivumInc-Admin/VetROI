import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'

// Import all node components
import TooltipNodeDemo from '../TooltipNode'
import DatabaseSchemaDemo from '../DatabaseSchemaNode'
import LabeledGroupNodeDemo from '../LabeledGroupNode'
import AnnotationNodeDemo from '../AnnotationNode'
import PlaceholderNodeDemo from '../PlaceholderNode'

const defaultNodeProps: any = {
  id: 'test-1',
  data: {},
  selected: false,
  type: 'test',
  xPos: 0,
  yPos: 0,
  dragging: false,
  draggable: true,
  selectable: true,
  deletable: true,
  isConnectable: true,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
  zIndex: 0
}

describe('Career Planner Node Components - Baseline Functionality', () => {
  describe('TooltipNode', () => {
    it('renders with default content', () => {
      render(
        <ReactFlowProvider>
          <TooltipNodeDemo {...defaultNodeProps} />
        </ReactFlowProvider>
      )
      expect(screen.getByText('Hover')).toBeInTheDocument()
    })

    it('applies selected class when selected', () => {
      render(
        <ReactFlowProvider>
          <TooltipNodeDemo {...defaultNodeProps} selected={true} />
        </ReactFlowProvider>
      )
      const node = screen.getByText('Hover').closest('.tooltip-node')
      expect(node).toHaveClass('selected')
    })
  })

  describe('DatabaseSchemaNode', () => {
    it('renders with default schema', () => {
      render(
        <ReactFlowProvider>
          <DatabaseSchemaDemo {...defaultNodeProps} />
        </ReactFlowProvider>
      )
      expect(screen.getByText('Table')).toBeInTheDocument()
      expect(screen.getByText('+ Add Field')).toBeInTheDocument()
    })
  })

  describe('LabeledGroupNode', () => {
    it('renders with default label', () => {
      render(
        <ReactFlowProvider>
          <LabeledGroupNodeDemo {...defaultNodeProps} />
        </ReactFlowProvider>
      )
      expect(screen.getByText('New Group')).toBeInTheDocument()
      expect(screen.getByText('Drop nodes here to add to group')).toBeInTheDocument()
    })

    it('shows collapse/expand button', () => {
      render(
        <ReactFlowProvider>
          <LabeledGroupNodeDemo {...defaultNodeProps} />
        </ReactFlowProvider>
      )
      expect(screen.getByTitle('Collapse group')).toBeInTheDocument()
    })
  })

  describe('AnnotationNode', () => {
    it('renders with default content', () => {
      render(
        <ReactFlowProvider>
          <AnnotationNodeDemo {...defaultNodeProps} />
        </ReactFlowProvider>
      )
      expect(screen.getByText('1.')).toBeInTheDocument()
      expect(screen.getByText(/Add your annotation here/)).toBeInTheDocument()
    })
  })

  describe('PlaceholderNode', () => {
    it('renders with placeholder content', () => {
      render(
        <ReactFlowProvider>
          <PlaceholderNodeDemo {...defaultNodeProps} />
        </ReactFlowProvider>
      )
      const placeholderElement = screen.getByText('+')
      expect(placeholderElement).toBeInTheDocument()
    })
  })
})
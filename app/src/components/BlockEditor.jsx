import React, { useState, useRef } from 'react'
import './BlockEditor.css'

const BlockEditor = ({ onRun, disabled, gameState }) => {
  const [blocks, setBlocks] = useState([])
  const [draggedBlock, setDraggedBlock] = useState(null)
  const [dragOverTarget, setDragOverTarget] = useState(null) // Track which block/zone is being dragged over
  const workspaceRef = useRef(null)
  const nextIdRef = useRef(1)

  // Block types
  const blockTypes = {
    action: [
      { type: 'sailUp', label: 'Sail Up', color: '#4CAF50', icon: '' },
      { type: 'sailDown', label: 'Sail Down', color: '#2196F3', icon: '' },
      { type: 'jump', label: 'Jump', color: '#FF9800', icon: '' },
      { type: 'cannon', label: 'Cannon', color: '#F44336', icon: '' },
      { type: 'bob', label: 'Bob', color: '#9C27B0', icon: '' },
      { type: 'wait', label: 'Wait', color: '#607D8B', icon: '', hasValue: true }
    ],
    control: [
      { type: 'forever', label: 'Forever', color: '#E91E63', icon: '', isContainer: true },
      { type: 'if', label: 'If', color: '#FF5722', icon: '', isContainer: true, hasCondition: true },
      { type: 'ifelse', label: 'If Else', color: '#FF5722', icon: '', isContainer: true, hasCondition: true, hasElse: true }
    ],
    condition: [
      { type: 'distance_lt', label: 'Distance <', color: '#00BCD4', icon: '<', hasValue: true },
      { type: 'distance_gt', label: 'Distance >', color: '#00BCD4', icon: '>', hasValue: true },
      { type: 'obstacle_type', label: 'Obstacle Type', color: '#00BCD4', icon: '', hasValue: true, valueType: 'select', options: ['wave', 'boat', 'storm', 'birdFlock', 'mines', 'shark'] },
      { type: 'storm_active', label: 'Storm Active', color: '#00BCD4', icon: '', hasValue: false }
    ]
  }

  const generateId = () => {
    return `block_${nextIdRef.current++}`
  }

  const handleDragStart = (e, blockType) => {
    if (disabled) return
    setDraggedBlock(blockType)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (e, targetId, isElse = false) => {
    if (!draggedBlock) return
    e.preventDefault()
    e.stopPropagation()
    setDragOverTarget({ id: targetId, isElse })
  }

  const handleDragLeave = (e) => {
    // Only clear if we're actually leaving the drop zone (not just moving to a child)
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    // Check if we're still within the bounds
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverTarget(null)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (!draggedBlock || disabled) return

    // Calculate vertical position for stacking blocks in a column
    // Find the bottom of the last block or use 0
    let maxY = 0
    if (blocks.length > 0) {
      // For now, just append to the end - blocks will stack naturally
      maxY = blocks.length * 50 // Approximate spacing
    }

    const newBlock = {
      id: generateId(),
      type: draggedBlock.type,
      label: draggedBlock.label,
      color: draggedBlock.color,
      icon: draggedBlock.icon,
      x: 0, // Always 0 for column layout
      y: maxY, // Stack vertically
      value: draggedBlock.hasValue ? (draggedBlock.valueType === 'select' ? draggedBlock.options[0] : 100) : null,
      valueType: draggedBlock.valueType,
      options: draggedBlock.options,
      isContainer: draggedBlock.isContainer || false,
      hasCondition: draggedBlock.hasCondition || false,
      hasElse: draggedBlock.hasElse || false,
      children: draggedBlock.isContainer ? [] : null,
      elseChildren: draggedBlock.hasElse ? [] : null
    }

    setBlocks([...blocks, newBlock])
    setDraggedBlock(null)
    setDragOverTarget(null)
  }

  const handleDeleteBlock = (id) => {
    if (disabled) return
    const deleteBlock = (blockList) => {
      return blockList.filter(block => {
        if (block.id === id) return false
        if (block.children) {
          block.children = deleteBlock(block.children)
        }
        if (block.elseChildren) {
          block.elseChildren = deleteBlock(block.elseChildren)
        }
        return true
      })
    }
    setBlocks(deleteBlock(blocks))
  }

  const handleValueChange = (id, value) => {
    if (disabled) return
    const updateBlock = (blockList) => {
      return blockList.map(block => {
        if (block.id === id) {
          return { ...block, value: block.valueType === 'select' ? value : (parseInt(value) || 0) }
        }
        if (block.children) {
          block.children = updateBlock(block.children)
        }
        if (block.elseChildren) {
          block.elseChildren = updateBlock(block.elseChildren)
        }
        return block
      })
    }
    setBlocks(updateBlock(blocks))
  }

  const handleDropOnBlock = (e, parentId, isElse = false) => {
    e.preventDefault()
    e.stopPropagation()
    if (!draggedBlock || disabled) return

    const newBlock = {
      id: generateId(),
      type: draggedBlock.type,
      label: draggedBlock.label,
      color: draggedBlock.color,
      icon: draggedBlock.icon,
      value: draggedBlock.hasValue ? (draggedBlock.valueType === 'select' ? draggedBlock.options[0] : 100) : null,
      valueType: draggedBlock.valueType,
      options: draggedBlock.options,
      isContainer: draggedBlock.isContainer || false,
      hasCondition: draggedBlock.hasCondition || false,
      hasElse: draggedBlock.hasElse || false,
      children: draggedBlock.isContainer ? [] : null,
      elseChildren: draggedBlock.hasElse ? [] : null
    }

    const addToBlock = (blockList) => {
      return blockList.map(block => {
        if (block.id === parentId) {
          if (isElse) {
            return { ...block, elseChildren: [...(block.elseChildren || []), newBlock] }
          } else {
            return { ...block, children: [...(block.children || []), newBlock] }
          }
        }
        if (block.children) {
          block.children = addToBlock(block.children)
        }
        if (block.elseChildren) {
          block.elseChildren = addToBlock(block.elseChildren)
        }
        return block
      })
    }

    setBlocks(addToBlock(blocks))
    setDraggedBlock(null)
    setDragOverTarget(null)
  }

  const handleRun = () => {
    if (disabled || blocks.length === 0) return
    
    // Convert block structure to algorithm
    const convertBlocksToAlgorithm = (blockList) => {
      const algorithm = []
      
      for (const block of blockList) {
        if (block.type === 'forever') {
          // Forever loop - repeat children infinitely
          if (block.children && block.children.length > 0) {
            const childAlgo = convertBlocksToAlgorithm(block.children)
            algorithm.push({ type: 'forever', children: childAlgo })
          }
        } else if (block.type === 'if' || block.type === 'ifelse') {
          // If/else blocks
          const condition = {
            type: 'condition',
            conditionType: block.conditionType || 'distance_lt',
            value: block.conditionValue !== undefined ? block.conditionValue : (block.conditionType === 'obstacle_type' ? 'wave' : 100)
          }
          const ifChildren = block.children ? convertBlocksToAlgorithm(block.children) : []
          const elseChildren = block.type === 'ifelse' && block.elseChildren ? convertBlocksToAlgorithm(block.elseChildren) : []
          algorithm.push({ 
            type: block.type === 'ifelse' ? 'ifelse' : 'if', 
            condition, 
            ifChildren, 
            elseChildren: block.type === 'ifelse' ? elseChildren : null,
            hasElse: block.type === 'ifelse'
          })
        } else {
          // Regular action block
          algorithm.push({
            type: block.type,
            value: block.value
          })
        }
      }
      
      return algorithm
    }
    
    const algorithm = convertBlocksToAlgorithm(blocks)
    onRun(algorithm)
  }

  const handleClear = () => {
    if (disabled) return
    setBlocks([])
    nextIdRef.current = 1
  }

  const renderBlock = (block, depth = 0, index = 0, siblingOffset = 0) => {
    // For nested blocks, no indent - they're positioned relative to parent
    // For top-level blocks, stack vertically (ignore x coordinate)
    const isNested = depth > 0

    if (block.isContainer) {
      // Forever blocks don't have puzzle piece shape
      const isForever = block.type === 'forever'
      return (
        <div
          key={block.id}
          className={`workspace-block container-block ${isForever ? 'no-puzzle-piece' : ''}`}
          style={{
            left: isNested ? '0' : '0', // Always start at left edge
            top: isNested ? 'auto' : 'auto', // Stack vertically for top-level
            position: isNested ? 'relative' : 'relative', // All blocks relative for vertical stacking
            marginTop: isNested && index > 0 ? '0px' : '0', // No gap for flush connection
            '--block-color': block.color
          }}
        >
          <div className="workspace-block-header">
            <span className="workspace-block-icon">{block.icon}</span>
            <span className="workspace-block-label">{block.label}</span>
            {block.hasCondition && (
              <div className="condition-input">
                <select
                  value={block.conditionType || 'distance_lt'}
                  onChange={(e) => {
                    const updateBlock = (blockList) => {
                      return blockList.map(b => {
                        if (b.id === block.id) {
                          return { ...b, conditionType: e.target.value }
                        }
                        if (b.children) b.children = updateBlock(b.children)
                        if (b.elseChildren) b.elseChildren = updateBlock(b.elseChildren)
                        return b
                      })
                    }
                    setBlocks(updateBlock(blocks))
                  }}
                  disabled={disabled}
                >
                  <option value="distance_lt">Distance &lt;</option>
                  <option value="distance_gt">Distance &gt;</option>
                  <option value="obstacle_type">Obstacle Type</option>
                  <option value="storm_active">Storm Active</option>
                </select>
                {block.conditionType !== 'obstacle_type' && block.conditionType !== 'storm_active' && (
                  <input
                    type="number"
                    value={block.conditionValue || 100}
                    onChange={(e) => {
                      const updateBlock = (blockList) => {
                        return blockList.map(b => {
                          if (b.id === block.id) {
                            return { ...b, conditionValue: parseInt(e.target.value) || 0 }
                          }
                          if (b.children) b.children = updateBlock(b.children)
                          if (b.elseChildren) b.elseChildren = updateBlock(b.elseChildren)
                          return b
                        })
                      }
                      setBlocks(updateBlock(blocks))
                    }}
                    disabled={disabled}
                    min="0"
                    style={{ width: '60px', marginLeft: '5px' }}
                  />
                )}
                {block.conditionType === 'obstacle_type' && (
                  <select
                    value={block.conditionValue || 'wave'}
                    onChange={(e) => {
                      const updateBlock = (blockList) => {
                        return blockList.map(b => {
                          if (b.id === block.id) {
                            return { ...b, conditionValue: e.target.value }
                          }
                          if (b.children) b.children = updateBlock(b.children)
                          if (b.elseChildren) b.elseChildren = updateBlock(b.elseChildren)
                          return b
                        })
                      }
                      setBlocks(updateBlock(blocks))
                    }}
                    disabled={disabled}
                    style={{ marginLeft: '5px', color: '#000000' }}
                    className="obstacle-type-select"
                  >
                    <option value="wave">Wave</option>
                    <option value="boat">Boat</option>
                    <option value="storm">Storm</option>
                    <option value="birdFlock">Bird Flock</option>
                    <option value="mines">Mines</option>
                    <option value="shark">Shark</option>
                  </select>
                )}
              </div>
            )}
            <button
              className="delete-block-btn"
              onClick={() => handleDeleteBlock(block.id)}
              disabled={disabled}
            >
              ×
            </button>
          </div>
          {block.children && (
            <div
              className={`block-children ${dragOverTarget?.id === block.id && !dragOverTarget?.isElse ? 'drag-over' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (!dragOverTarget || dragOverTarget.id !== block.id || dragOverTarget.isElse) {
                  setDragOverTarget({ id: block.id, isElse: false })
                }
              }}
              onDragEnter={(e) => handleDragEnter(e, block.id, false)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => {
                handleDropOnBlock(e, block.id, false)
                setDragOverTarget(null)
              }}
            >
              {block.children.length === 0 && (
                <div className="drop-zone">Drop blocks here</div>
              )}
              {block.children.map((child, idx) => renderBlock(child, depth + 1, idx, 0))}
            </div>
          )}
          {block.hasElse && (
              <div className="block-else">
              <div className="else-label">Else:</div>
              <div
                className={`block-children ${dragOverTarget?.id === block.id && dragOverTarget?.isElse ? 'drag-over' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (!dragOverTarget || dragOverTarget.id !== block.id || !dragOverTarget.isElse) {
                    setDragOverTarget({ id: block.id, isElse: true })
                  }
                }}
                onDragEnter={(e) => handleDragEnter(e, block.id, true)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => {
                  handleDropOnBlock(e, block.id, true)
                  setDragOverTarget(null)
                }}
              >
                {block.elseChildren && block.elseChildren.length === 0 && (
                  <div className="drop-zone">Drop blocks here</div>
                )}
                {block.elseChildren && block.elseChildren.map((child, idx) => renderBlock(child, depth + 1, idx, 0))}
              </div>
            </div>
          )}
        </div>
      )
    }

    return (
      <div
        key={block.id}
        className="workspace-block"
        style={{
          left: '0', // Always start at left edge
          top: 'auto', // Stack vertically
          position: 'relative', // Relative positioning for vertical stacking
          marginTop: isNested && index > 0 ? '0px' : '0', // No gap for flush connection
          '--block-color': block.color
        }}
      >
        <div className="workspace-block-header">
          <span className="workspace-block-icon">{block.icon}</span>
          <span className="workspace-block-label">{block.label}</span>
          <button
            className="delete-block-btn"
            onClick={() => handleDeleteBlock(block.id)}
            disabled={disabled}
          >
            ×
          </button>
        </div>
        {block.value !== null && (
          <div className="workspace-block-value">
            {block.valueType === 'select' ? (
              <select
                value={block.value}
                onChange={(e) => handleValueChange(block.id, e.target.value)}
                disabled={disabled}
              >
                {block.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <>
                <label>Value (ms):</label>
                <input
                  type="number"
                  value={block.value}
                  onChange={(e) => handleValueChange(block.id, e.target.value)}
                  disabled={disabled}
                  min="0"
                />
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="block-editor">
      <div className="block-editor-header">
        <h2>Block Editor</h2>
        <div className="block-editor-actions">
          <button 
            onClick={handleRun} 
            disabled={disabled || blocks.length === 0}
            className="run-button"
          >
            Run Algorithm
          </button>
          <button 
            onClick={handleClear} 
            disabled={disabled}
            className="clear-button"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="block-palette">
        <div className="palette-section">
          <h3>Control Blocks</h3>
          <div className="block-list">
            {blockTypes.control.map(blockType => (
              <div
                key={blockType.type}
                className="block-item"
                draggable={!disabled}
                onDragStart={(e) => handleDragStart(e, blockType)}
                style={{ borderColor: blockType.color }}
              >
                <span className="block-icon">{blockType.icon}</span>
                <span className="block-label">{blockType.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="palette-section">
          <h3>Action Blocks</h3>
          <div className="block-list">
            {blockTypes.action.map(blockType => (
              <div
                key={blockType.type}
                className="block-item"
                draggable={!disabled}
                onDragStart={(e) => handleDragStart(e, blockType)}
                style={{ borderColor: blockType.color }}
              >
                <span className="block-icon">{blockType.icon}</span>
                <span className="block-label">{blockType.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="block-workspace-container">
        <h3>Workspace</h3>
        <div
          ref={workspaceRef}
          className={`block-workspace ${draggedBlock ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragOverTarget(null)}
          onDrop={(e) => {
            handleDrop(e)
            setDragOverTarget(null)
          }}
        >
          {blocks.map((block, idx) => renderBlock(block, 0, idx, 0))}
          {blocks.length === 0 && (
            <div className="workspace-empty">
              <p>Drag blocks here to build your algorithm</p>
              <p className="hint">Start with a "Forever" block, then add "If" blocks and actions inside!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BlockEditor

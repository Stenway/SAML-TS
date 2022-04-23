/* (C) Stefan John / Stenway / Stenway.com / 2022 */

import { SmlAttribute, SmlDocument, SmlElement } from "./sml.js"
import { UiButton, UiCheckBox, UiCheckMenuItem, UiCommandMenuItem, UiControl, UiEnumMenuItem, UiGridLayout, UiGridLayoutChild, UiLabel, UiLinearLayout, UiLinearLayoutChild, UiMenuBar, UiMenuBarDropDownMenu, UiNothing, UiTab, UiTabControl, UiTextBox, UiThickness } from "./saml.js"

// ----------------------------------------------------------------------

export class UiParser {

	static controlPropertyElements: string[] = ["Margin"]

	parseMargin(element: SmlElement, control: UiControl) {
		let marginElement: SmlElement | null = element.optionalElement("Margin")
		if (marginElement !== null) {
			let left: number = 0
			let top: number = 0
			let right: number = 0
			let bottom: number = 0
			let leftAttribute: SmlAttribute | null = marginElement.optionalAttribute("Left")
			if (leftAttribute !== null) { left = leftAttribute.asFloat() }
			let topAttribute: SmlAttribute | null = marginElement.optionalAttribute("Top")
			if (topAttribute !== null) { top = topAttribute.asFloat() }
			let rightAttribute: SmlAttribute | null = marginElement.optionalAttribute("Right")
			if (rightAttribute !== null) { right = rightAttribute.asFloat() }
			let bottomAttribute: SmlAttribute | null = marginElement.optionalAttribute("Bottom")
			if (bottomAttribute !== null) { bottom = bottomAttribute.asFloat() }
			control.margin = new UiThickness(left, top, right, bottom)
		}
	}

	parseControlProperties(element: SmlElement, control: UiControl) {
		this.parseMargin(element, control)
	}

	parseTabControl(element: SmlElement): UiTabControl {
		element.assureElementNames(["Tab"])

		let tabControl: UiTabControl = new UiTabControl()
		for (let tabElement of element.elements("Tab")) {
			tabElement.assureAttributeNames(["Title"])
			tabElement.assureElementNames(["Content"])

			let tab: UiTab = new UiTab()

			let contentElement: SmlElement | null = tabElement.optionalElement("Content")
			if (contentElement !== null) {
				contentElement.assureNoAttributes()
				contentElement.assureElementCount(1)
				tab.content = this.parseControl(contentElement.elements()[0])
			}
			
			let titleAttribute: SmlAttribute | null = tabElement.optionalAttribute("Title")
			if (titleAttribute !== null) { tab.text = titleAttribute.asString() }
			
			tabControl.addTab(tab)
		}
		return tabControl
	}

	parseLinearLayout(element: SmlElement): UiLinearLayout {
		element.assureAttributeNames(["Direction"])
		element.assureElementNames(["Child"].concat(UiParser.controlPropertyElements))

		let vertical: boolean = false
		let directionAttribute: SmlAttribute | null = element.optionalAttribute("Direction")
		if (directionAttribute !== null) {
			vertical = directionAttribute.asEnum(["Horizontal", "Vertical"]) === 1
		}
		let linearLayout: UiLinearLayout = new UiLinearLayout(vertical)
		for (let childElement of element.elements("Child")) {
			childElement.assureAttributeNames(["Weight"])
			childElement.assureElementCount(1)
			let childControl: UiControl = this.parseControl(childElement.elements()[0])
			let weight: number | null = null
			let weightAttribute: SmlAttribute | null = childElement.optionalAttribute("Weight")
			if (weightAttribute !== null) { weight = weightAttribute.asFloat() }
			let child: UiLinearLayoutChild = new UiLinearLayoutChild(childControl, weight)
			linearLayout.addChild(child)
		}
		this.parseControlProperties(element, linearLayout)
		return linearLayout
	}

	parseGridLayout(element: SmlElement): UiGridLayout {
		element.assureElementNames(["Child"])

		let gridLayout: UiGridLayout = new UiGridLayout()
		for (let childElement of element.elements("Child")) {
			childElement.assureAttributeNames(["Column", "Row"])
			childElement.assureElementCount(1)
			let childControl: UiControl = this.parseControl(childElement.elements()[0])

			let columnAttribute: SmlAttribute | null = childElement.requiredAttribute("Column")
			let rowAttribute: SmlAttribute | null = childElement.requiredAttribute("Row")

			columnAttribute.assureValueCountMinMax(1, 2)
			rowAttribute.assureValueCountMinMax(1, 2)

			let columnIndex: number = columnAttribute.getInt(0)
			let columnSpan: number = 1
			if (columnAttribute.valueCount === 2) {
				columnSpan = columnAttribute.getInt(1)
			}
			let rowIndex: number = rowAttribute.getInt(0)
			let rowSpan: number = 1
			if (rowAttribute.valueCount === 2) {
				rowSpan = rowAttribute.getInt(1)
			}

			let child: UiGridLayoutChild = new UiGridLayoutChild(childControl, columnIndex, columnSpan, rowIndex, rowSpan)
			gridLayout.addChild(child)
		}
		return gridLayout
	}

	parseMenuBar(element: SmlElement): UiMenuBar {
		let menuBar: UiMenuBar = new UiMenuBar()

		for (let dropDownMenuElement of element.elements("DropDownMenu")) {
			dropDownMenuElement.assureAttributeNames(["Item", "Command", "CheckItem", "Enum"])
			let dropDownMenu: UiMenuBarDropDownMenu = new UiMenuBarDropDownMenu()

			let itemAttribute: SmlAttribute | null = dropDownMenuElement.optionalAttribute("Item")
			if (itemAttribute !== null) {
				dropDownMenu.title = itemAttribute.asString()
			}

			for (let attribute of dropDownMenuElement.attributes()) {
				if (attribute.hasName("Command")) {
					let commandMenuItem: UiCommandMenuItem = new UiCommandMenuItem()
					commandMenuItem.command = attribute.asString()
					dropDownMenu.addItem(commandMenuItem)
				} else if (attribute.hasName("CheckItem")) {
					let checkMenuItem: UiCheckMenuItem = new UiCheckMenuItem()
					checkMenuItem.bool = attribute.asString()
					dropDownMenu.addItem(checkMenuItem)
				} else if (attribute.hasName("Enum")) {
					let enumMenuItem: UiEnumMenuItem = new UiEnumMenuItem()
					enumMenuItem.enum = attribute.asString()
					dropDownMenu.addItem(enumMenuItem)
				}
			}

			menuBar.addItem(dropDownMenu)
		}
		
		return menuBar
	}

	parseButton(element: SmlElement): UiButton {
		let button: UiButton = new UiButton()

		let commandAttribute: SmlAttribute | null = element.optionalAttribute("Command")
		if (commandAttribute !== null) {
			button.command = commandAttribute.asString()
		}

		this.parseControlProperties(element, button)

		return button
	}

	parseCheckBox(element: SmlElement): UiCheckBox {
		let checkBox: UiCheckBox = new UiCheckBox()

		this.parseControlProperties(element, checkBox)

		return checkBox
	}

	parseNothing(element: SmlElement): UiNothing {
		return new UiNothing()
	}

	parseTextBox(element: SmlElement): UiTextBox {
		let multiLine: boolean = false
		let multiLineAttribute: SmlAttribute | null = element.optionalAttribute("MultiLine")
		if (multiLineAttribute !== null) { multiLine = multiLineAttribute.asBool() }

		let textBox: UiTextBox = new UiTextBox(multiLine)

		let itemAttribute: SmlAttribute | null = element.optionalAttribute("Item")
		if (itemAttribute !== null) {
			textBox.item = itemAttribute.asString()
		}

		return textBox
	}

	parseLabel(element: SmlElement): UiLabel {
		element.assureNoElements()
		element.assureAttributeNames(["Item"])

		let label: UiLabel = new UiLabel()
		
		let itemAttribute: SmlAttribute | null = element.optionalAttribute("Item")
		if (itemAttribute !== null) {
			label.item = itemAttribute.asString()
		}

		return label
	}

	parseControl(element: SmlElement): UiControl {
		if (element.hasName("LinearLayout")) { return this.parseLinearLayout(element) }
		else if (element.hasName("GridLayout")) { return this.parseGridLayout(element) }
		else if (element.hasName("TabControl")) { return this.parseTabControl(element) }
		else if (element.hasName("MenuBar")) { return this.parseMenuBar(element) }
		else if (element.hasName("Button")) { return this.parseButton(element) }
		else if (element.hasName("CheckBox")) { return this.parseCheckBox(element) }
		else if (element.hasName("Nothing")) { return this.parseNothing(element) }
		else if (element.hasName("TextBox")) { return this.parseTextBox(element) }
		else if (element.hasName("Label")) { return this.parseLabel(element) }
		throw new Error(`Not supported element "${element.name}"`)
	}

	static parse(content: string): UiControl {
		let document: SmlDocument = SmlDocument.parse(content)
		return new UiParser().parseControl(document.root)
	}
}
/**
 * @license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import { Directive } from '@angular/core';
import { MultiEvent, Scan } from '@motifmarkets/motif-core';
import { ExpandableCollapsibleLinedHeadingNgComponent } from '../../../expandable-collapsible-lined-heading/ng-api';
import { ContentComponentBaseNgDirective } from '../../../ng/content-component-base-ng.directive';

@Directive()
export abstract class ScanPropertiesSectionNgDirective extends ContentComponentBaseNgDirective {
    protected _sectionHeadingComponent: ExpandableCollapsibleLinedHeadingNgComponent;
    protected _scan: Scan | undefined;

    private _scanPropertiesChangedSubscriptionId: MultiEvent.SubscriptionId | undefined;

    public abstract sectionHeadingText: string;

    initialiseSectionHeadingComponent() {
        this._sectionHeadingComponent.expandEventer = () => this.handleExpandEvent();
        this._sectionHeadingComponent.restoreEventer = () => this.handleRestoreEvent();
        this._sectionHeadingComponent.collapseEventer = () => this.handleCollapseEvent();
    }

    setScan(value: Scan | undefined) {
        if (this._scan !== undefined) {
            this._scan.unsubscribeValuesChangedEvent(this._scanPropertiesChangedSubscriptionId);
            this._scanPropertiesChangedSubscriptionId = undefined;
        }
        this._scan = value;
        if (this._scan !== undefined) {
            this._scanPropertiesChangedSubscriptionId = this._scan.subscribeValuesChangedEvent(
                (valueChanges) => this.processChangedProperties(valueChanges)
            );
        }
    }

    private handleExpandEvent() {

    }

    private handleRestoreEvent() {

    }

    private handleCollapseEvent() {

    }

    protected abstract processChangedProperties(valueChanges: readonly Scan.ValueChange[]): void;
}

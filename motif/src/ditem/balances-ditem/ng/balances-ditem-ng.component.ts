/**
 * @license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, ViewChild } from '@angular/core';
import { ComponentContainer } from 'golden-layout';
import { BrokerageAccountGroup } from 'src/adi/internal-api';
import { CommandRegisterNgService, CoreNgService, SettingsNgService } from 'src/component-services/ng-api';
import { TableNgComponent } from 'src/content/ng-api';
import { BrokerageAccountGroupInputNgComponent, SvgButtonNgComponent } from 'src/controls/ng-api';
import { BrokerageAccountGroupUiAction, IconButtonUiAction, InternalCommand, UiAction } from 'src/core/internal-api';
import { StringId, Strings } from 'src/res/internal-api';
import { assert, delay1Tick, Integer, JsonElement } from 'src/sys/internal-api';
import { BuiltinDitemNgComponentBaseNgDirective } from '../../ng/builtin-ditem-ng-component-base.directive';
import { DesktopAccessNgService } from '../../ng/desktop-access-ng.service';
import { BalancesDitemFrame } from '../balances-ditem-frame';

@Component({
    selector: 'app-balances-ditem',
    templateUrl: './balances-ditem-ng.component.html',
    styleUrls: ['./balances-ditem-ng.component.scss'],

    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BalancesDitemNgComponent extends BuiltinDitemNgComponentBaseNgDirective implements AfterViewInit, OnDestroy {

    @ViewChild('table', { static: true }) private _tableComponent: TableNgComponent;
    @ViewChild('accountGroupInput', { static: true }) private _accountGroupInputComponent: BrokerageAccountGroupInputNgComponent;
    @ViewChild('accountLinkButton', { static: true }) private _accountLinkButtonComponent: SvgButtonNgComponent;

    private _accountGroupUiAction: BrokerageAccountGroupUiAction;
    private _toggleAccountGroupLinkingUiAction: IconButtonUiAction;

    private _frame: BalancesDitemFrame;

    protected get stateSchemaVersion() { return BalancesDitemNgComponent.stateSchemaVersion; }
    get ditemFrame() { return this._frame; }

    constructor(
        cdr: ChangeDetectorRef,
        @Inject(BuiltinDitemNgComponentBaseNgDirective.goldenLayoutContainerInjectionToken) container: ComponentContainer,
        elRef: ElementRef,
        settingsNgService: SettingsNgService,
        commandRegisterNgService: CommandRegisterNgService,
        desktopAccessNgService: DesktopAccessNgService,
        pulseService: CoreNgService
    ) {
        super(cdr, container, elRef, settingsNgService.settingsService, commandRegisterNgService.service);

        this._frame = new BalancesDitemFrame(this, this.commandRegisterService,
            desktopAccessNgService.service, pulseService.symbolsManager, pulseService.adi);
        this._frame.recordFocusEvent = (recordIndex) => this.handleRecordFocusEvent(recordIndex);
        this._frame.tableOpenEvent = (group) => this.handleTableOpenEvent(group);

        this._accountGroupUiAction = this.createAccountIdUiAction();
        this._toggleAccountGroupLinkingUiAction = this.createToggleAccountGroupLinkingUiAction();

        this.constructLoad(this.getInitialComponentStateJsonElement());

        this.pushAccountLinkButtonState();
        this._accountGroupUiAction.pushValue(BrokerageAccountGroup.createAll());
    }

    public ngAfterViewInit() {
        assert(this._tableComponent !== undefined, 'BDCNAVI22953');

        delay1Tick(() => this.initialise());
    }

    public ngOnDestroy() {
        this.finalise();
    }

    public processBrokerageAccountGroupLinkedChanged() {
        this.pushAccountLinkButtonState();
    }

    protected initialise() {
        this._accountGroupInputComponent.initialise(this._accountGroupUiAction);
        this._accountLinkButtonComponent.initialise(this._toggleAccountGroupLinkingUiAction);

        const componentStateElement = this.getInitialComponentStateJsonElement();
        const frameElement = this.tryGetChildFrameJsonElement(componentStateElement);
        this._frame.initialise(this._tableComponent.frame, frameElement);

        super.initialise();
    }

    protected finalise() {
        this._accountGroupUiAction.finalise();
        this._toggleAccountGroupLinkingUiAction.finalise();

        this._frame.finalise();
        super.finalise();
    }

    protected constructLoad(element: JsonElement | undefined) {
        const frameElement = this.tryGetChildFrameJsonElement(element);
        this._frame.constructLoad(frameElement);
    }

    protected save(element: JsonElement) {
        const frameElement = this.createChildFrameJsonElement(element);
        this._frame.save(frameElement);
    }

    private handleAccountGroupCommitEvent(typeId: UiAction.CommitTypeId) {
        const accountId = this._accountGroupUiAction.definedValue;
        this._frame.setBrokerageAccountGroupFromDitem(accountId);
    }

    private handleAccountLinkSignalEvent() {
        this._frame.brokerageAccountGroupLinked = !this._frame.brokerageAccountGroupLinked;
    }

    private handleRecordFocusEvent(recordIndex: Integer | undefined) {
        //
    }

    private handleTableOpenEvent(group: BrokerageAccountGroup) {
        this._accountGroupUiAction.pushValue(group);
    }

    private createAccountIdUiAction() {
        const action = new BrokerageAccountGroupUiAction();
        action.pushOptions({ allAllowed: true });
        action.pushTitle(Strings[StringId.SelectAccountTitle]);
        action.pushPlaceholder(Strings[StringId.BrokerageAccountIdInputPlaceholderText]);
        action.commitEvent = (typeId) => this.handleAccountGroupCommitEvent(typeId);
        return action;
    }

    private createToggleAccountGroupLinkingUiAction() {
        const commandName = InternalCommand.Name.ToggleAccountLinking;
        const displayId = StringId.ToggleAccountLinkingCaption;
        const command = this.commandRegisterService.getOrRegisterInternalCommand(commandName, displayId);
        const action = new IconButtonUiAction(command);
        action.pushTitle(Strings[StringId.ToggleAccountLinkingTitle]);
        action.pushIcon(IconButtonUiAction.IconId.AccountGroupLink);
        action.signalEvent = () => this.handleAccountLinkSignalEvent();
        return action;
    }

    private pushAccountLinkButtonState() {
        if (this._frame.brokerageAccountGroupLinked) {
            this._toggleAccountGroupLinkingUiAction.pushSelected();
        } else {
            this._toggleAccountGroupLinkingUiAction.pushUnselected();
        }
    }
}

export namespace BalancesDitemNgComponent {
    export const stateSchemaVersion = '2';
}

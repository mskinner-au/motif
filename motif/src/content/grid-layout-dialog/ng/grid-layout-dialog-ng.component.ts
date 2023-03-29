/**
 * @license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Inject,
    Injector,
    OnDestroy,
    StaticProvider,
    ViewChild,
    ViewContainerRef
} from '@angular/core';
import {
    ButtonUiAction,
    CommandRegisterService,
    delay1Tick,
    GridField,
    GridLayoutDefinition,
    IconButtonUiAction,
    InternalCommand,
    StringId,
    Strings
} from '@motifmarkets/motif-core';
import { CommandRegisterNgService } from 'component-services-ng-api';
import { ButtonInputNgComponent, SvgButtonNgComponent } from 'controls-ng-api';
import { ContentComponentBaseNgDirective } from '../../ng/content-component-base-ng.directive';
import { GridLayoutEditorNgComponent } from '../editor/ng-api';
import { allowedFieldsInjectionToken, oldLayoutDefinitionInjectionToken } from '../grid-layout-dialog-injection-tokens';

@Component({
    selector: 'app-grid-layout-dialog',
    templateUrl: './grid-layout-dialog-ng.component.html',
    styleUrls: ['./grid-layout-dialog-ng.component.scss'],

    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridLayoutDialogNgComponent extends ContentComponentBaseNgDirective implements AfterViewInit, OnDestroy {
    @ViewChild('subDialog', { static: true, read: ViewContainerRef }) private _subDialogContainer: ViewContainerRef;
    @ViewChild('okButton', { static: true }) private _okButtonComponent: SvgButtonNgComponent;
    @ViewChild('cancelButton', { static: true }) private _cancelButtonComponent: SvgButtonNgComponent;
    @ViewChild('editorButton', { static: true }) private _editorButtonComponent: ButtonInputNgComponent;

    public caption = 'Grid Columns';

    private _commandRegisterService: CommandRegisterService;

    private _okUiAction: IconButtonUiAction;
    private _cancelUiAction: IconButtonUiAction;
    private _editorUiAction: ButtonUiAction;

    private _closeResolve: (value: GridLayoutDefinition | undefined) => void;
    private _closeReject: (reason: unknown) => void;

    constructor(
        private _cdr: ChangeDetectorRef,
        commandRegisterNgService: CommandRegisterNgService,
        @Inject(allowedFieldsInjectionToken) private readonly _allowedFields: readonly GridField[],
        @Inject(oldLayoutDefinitionInjectionToken) private readonly _oldLayoutDefinition: GridLayoutDefinition,
    ) {
        super();

        this._commandRegisterService = commandRegisterNgService.service;
        this._okUiAction = this.createOkUiAction();
        this._cancelUiAction = this.createCancelUiAction();
        this._editorUiAction = this.createEditorUiAction();

        // this._subDialogContainer.setAllowedFieldsAndLayoutDefinition(
        //     allowedFieldsAndLayoutDefinition.allowedFields,
        //     allowedFieldsAndLayoutDefinition.layoutDefinition,
        // );
    }

    ngAfterViewInit() {
        delay1Tick(() => this.initialise());
    }

    ngOnDestroy() {
        this._okUiAction.finalise();
        this._cancelUiAction.finalise();
        this._editorUiAction.finalise();
    }

    waitClose(): GridLayoutDialogNgComponent.ClosePromise {
        return new Promise<GridLayoutDefinition | undefined>((resolve, reject) => {
            this._closeResolve = resolve;
            this._closeReject = reject;
        });
    }

    private handleOkSignal() {
        this.close(true);
    }

    private handleCancelSignal() {
        this.close(false);
    }

    private createOkUiAction() {
        const commandName = InternalCommand.Id.GridLayoutDialog_Ok;
        const displayId = StringId.Ok;
        const command = this._commandRegisterService.getOrRegisterInternalCommand(commandName, displayId);
        const action = new IconButtonUiAction(command);
        action.pushIcon(IconButtonUiAction.IconId.ReturnOk);
        action.signalEvent = () => this.handleOkSignal();
        return action;
    }

    private createCancelUiAction() {
        const commandName = InternalCommand.Id.GridLayoutDialog_Cancel;
        const displayId = StringId.Cancel;
        const command = this._commandRegisterService.getOrRegisterInternalCommand(commandName, displayId);
        const action = new IconButtonUiAction(command);
        action.pushIcon(IconButtonUiAction.IconId.ReturnCancel);
        action.signalEvent = () => this.handleCancelSignal();
        return action;
    }

    private createEditorUiAction(): ButtonUiAction {
        const commandName = InternalCommand.Id.GridLayoutDialog_EditColumns;
        const displayId = StringId.Edit;
        const command = this._commandRegisterService.getOrRegisterInternalCommand(commandName, displayId);
        const action = new ButtonUiAction(command);
        action.pushTitle(Strings[StringId.GridLayoutDialog_EditGridColumns]);
        action.pushUnselected();
        action.signalEvent = () => this.showEditor();
        return action;
    }

    private initialise() {
        this._okButtonComponent.initialise(this._okUiAction);
        this._cancelButtonComponent.initialise(this._cancelUiAction);
        this._editorButtonComponent.initialise(this._editorUiAction);
        this.showEditor();
    }

    private close(ok: boolean) {
        if (ok) {
            // this._closeResolve(this._subDialogContainer.getGridLayoutDefinition());
        } else {
            this._closeResolve(undefined);
        }
    }

    private showEditor() {
        this._subDialogContainer.clear();
        this._subDialogContainer.createComponent(GridLayoutEditorNgComponent);
    }
}

export namespace GridLayoutDialogNgComponent {
    export type ClosePromise = Promise<GridLayoutDefinition | undefined>;

    export function create(
        container: ViewContainerRef,
        allowedFields: readonly GridField[],
        layoutDefinition: GridLayoutDefinition,
    ): GridLayoutDialogNgComponent {
        container.clear();

        const allowedFieldsProvider: StaticProvider = {
            provide: allowedFieldsInjectionToken,
            useValue: allowedFields,
        };
        const layoutDefinitionProvider: StaticProvider = {
            provide: oldLayoutDefinitionInjectionToken,
            useValue: layoutDefinition,
        };
        const injector = Injector.create({
            providers: [allowedFieldsProvider, layoutDefinitionProvider],
        });

        const componentRef = container.createComponent(GridLayoutDialogNgComponent, { injector });
        const component = componentRef.instance;

        return component;
    }
}

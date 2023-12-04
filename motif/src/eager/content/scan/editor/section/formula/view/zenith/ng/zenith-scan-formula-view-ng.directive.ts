/**
 * @license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import { AfterViewInit, Directive, ElementRef, Injector, OnDestroy, ViewChild, ViewContainerRef, createNgModule } from '@angular/core';
import { AssertInternalError, MultiEvent, ScanEditor, ScanFormulaZenithEncoding, delay1Tick } from '@motifmarkets/motif-core';
import { CodeMirrorNgComponent } from 'code-mirror-ng-api';
import { ScanFormulaViewNgDirective } from '../../scan-formula-view-ng.directive';
import { ZenithScanFormulaViewDecodeProgressNgComponent } from '../decode-progress/ng-api';

@Directive({
    selector: '[appZenithScanFormulaView]',
})
export abstract class ZenithScanFormulaViewNgDirective extends ScanFormulaViewNgDirective implements OnDestroy, AfterViewInit {
    private static typeInstanceCreateCount = 0;

    @ViewChild('editorContainer', { read: ViewContainerRef, static: true }) private _editorContainer: ViewContainerRef;
    @ViewChild('decodeProgress', { static: true }) private _decodeProgresComponent: ZenithScanFormulaViewDecodeProgressNgComponent;
    private _editorComponent: CodeMirrorNgComponent;

    private _scanEditorFieldChangesSubscriptionId: MultiEvent.SubscriptionId;
    private _docChangedDebounceTimeoutHandle: ReturnType<typeof setInterval> | undefined;

    constructor(
        elRef: ElementRef<HTMLElement>,
        private readonly _injector: Injector,
    ) {
        super(elRef, ++ZenithScanFormulaViewNgDirective.typeInstanceCreateCount);
    }

    ngOnDestroy(): void {
        if (this._docChangedDebounceTimeoutHandle !== undefined) {
            clearTimeout(this._docChangedDebounceTimeoutHandle);
            this._docChangedDebounceTimeoutHandle = undefined;
        }
    }

    ngAfterViewInit(): void {
        delay1Tick(() => {
            const loadPromise = this.loadEditorComponent();
            AssertInternalError.throwErrorIfPromiseRejected(loadPromise, 'ZSCVNCNAVID1T29871');
        });
    }

    async loadEditorComponent() {
        const moduleRef = await this.getCodeMirrorModuleInstance();
        const componentType = moduleRef.instance.codeMirrorComponentType;
        // const { CodeMirrorNgComponent: componentType } = await import('code-mirror-component');
        this._editorContainer.clear();
        const editorComponentRef = this._editorContainer.createComponent(componentType, {
            ngModuleRef: moduleRef,
            // environmentInjector: this._environmentInjector,
            injector: this._injector,
        });
        this._editorComponent = editorComponentRef.instance;
        this._editorComponent.docChangedEventer = () => this.processDocChanged();
        delay1Tick(() => this._editorComponent.initialise());
    }

    override setEditor(value: ScanEditor | undefined) {
        const oldEditor = this.scanEditor;
        if (oldEditor !== undefined) {
            oldEditor.unsubscribeFieldChangesEvents(this._scanEditorFieldChangesSubscriptionId);
            this._scanEditorFieldChangesSubscriptionId = undefined;
            this._editorComponent.text = '';
        }

        super.setEditor(value);

        if (value !== undefined) {
            const text = this.getFormulaAsZenithText(value);
            this._editorComponent.text = text;
            this._scanEditorFieldChangesSubscriptionId = value.subscribeFieldChangesEvents(
                (changedFieldIds) => { this.processScanEditorFieldChanges(value, changedFieldIds); }
            );
        }
    }

    private async getCodeMirrorModuleInstance() {
        // https://stackoverflow.com/questions/75883330/how-to-load-lazy-modules-programmatically-in-angular-app
        const { CodeMirrorNgModule } = await import('code-mirror-ng-api')
        return createNgModule(CodeMirrorNgModule, this._injector);
    }

    private processDocChanged() {
        if (this._docChangedDebounceTimeoutHandle !== undefined) {
            clearTimeout(this._docChangedDebounceTimeoutHandle);
        }
        this._docChangedDebounceTimeoutHandle = setInterval(
            () => this.processDebouncedDocChanged(),
            ZenithScanFormulaViewNgDirective.docChangedDebounceInterval
        );
    }

    private processDebouncedDocChanged() {
        const scanEditor = this.scanEditor;
        if (scanEditor !== undefined) {
            const text = this._editorComponent.text;
            const error = this.setFormulaAsZenithText(scanEditor, text);
            if (error === undefined) {
                this._decodeProgresComponent.setDecodeProgress(undefined);
            } else {
                this._decodeProgresComponent.setDecodeProgress(error.progress);
            }
        }
    }

    private processScanEditorFieldChanges(editor: ScanEditor, changedFieldIds: readonly ScanEditor.FieldId[]) {
        const text = this.getFormulaAsZenithTextIfChanged(editor, changedFieldIds);
        if (text !== undefined) {
            this._editorComponent.text = text;
        }
    }

    protected abstract getFormulaAsZenithTextIfChanged(editor: ScanEditor, changedFieldIds: readonly ScanEditor.FieldId[]): string | undefined;
    protected abstract getFormulaAsZenithText(editor: ScanEditor): string;
    protected abstract setFormulaAsZenithText(editor: ScanEditor, text: string): ScanFormulaZenithEncoding.DecodeError | undefined;
}

export namespace ZenithScanFormulaViewNgDirective {
    export const docChangedDebounceInterval = 500;
}

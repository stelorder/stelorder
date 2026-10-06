import { Icon, Tooltip } from "@stelsolutions/stelorder-catalog";
import { TooltipAlignMessage } from "@stelsolutions/stelorder-catalog/dist/components/tooltip/tooltip";

type HelpTooltipProps = {
    message: string;
    alignMessage?: TooltipAlignMessage;
    iconSize?: {
        width: string;
        height: string;
    };
    maxWidth?: string;
    showIn?: HTMLDivElement | null;
};

export function HelpTooltip({
                                message,
                                alignMessage = "right",
                                iconSize,
                                maxWidth,
                                showIn = document.body as HTMLDivElement,
                            }: HelpTooltipProps) {

    return (
        <Tooltip
            alignMessage={alignMessage}
            showIn={showIn}
            message={
                <div
                    style={{
                        maxWidth: maxWidth || "30vw",
                        whiteSpace: "pre-line",
                    }}
                >
                    {message}
                </div>
            }
        >
            <Icon variant="question-mark"
                  height={iconSize?.height || "20px"}
                  width={iconSize?.width || "12px"}
            />
        </Tooltip>
    );
}